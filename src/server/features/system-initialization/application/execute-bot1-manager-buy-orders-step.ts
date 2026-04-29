/**
 * Bot1 管理员创建收购订单步骤
 *
 * 根据目标配方（土地开垦徽章）的原材料需求，在收购站自动创建收购订单。
 * 定价策略：基于原材料的递归生产成本，加上固定加价率（20%）。
 */

import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { ItemKey } from "@/server/features/item/item-catalog";
import { normalizeItemKey } from "@/server/features/item/domain/value-objects/item-stack";
import { BOT1_MANAGER_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { FinanceService } from "@/server/features/finance/application/services/finance-service";
import { Username } from "@/server/features/person/domain/value-objects/username";
import { executeCreateBuyOrderUseCase } from "@/server/features/purchasing-station/application/create-buy-order-use-case";
import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import { listRecipes } from "@/server/features/recipe";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";

/** 目标配方 ID：土地开垦徽章 */
const TARGET_RECIPE_ID = "craft_land_reclamation_badge";
/** 收购订单相对于生产成本的加价率（20%） */
const BUY_ORDER_MARKUP_RATE = 0.2;

/** 步骤所需的外部依赖 */
type ExecuteBot1ManagerBuyOrdersStepDeps = {
  userRepository: UserRepository;
  buildingRepository: BuildingRepository;
  buyOrderRepository: BuyOrderRepository;
  financeService: FinanceService;
  plotRepository: PlotRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

type Bot1ManagerBuyOrdersStepSuccessResult = {
  createdOrdersCount: number;
  orderedItemsCount: number;
};

type Bot1ManagerBuyOrdersStepFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type ExecuteBot1ManagerBuyOrdersStepResult =
  | Bot1ManagerBuyOrdersStepSuccessResult
  | Bot1ManagerBuyOrdersStepFailureResult;

/**
 * 递归计算物品的单位生产成本
 *
 * 遍历所有能产出该物品的配方，选取成本最低的配方路线。
 * 使用 cache 记忆化避免重复计算，使用 visiting 集合检测循环依赖。
 *
 * @param itemKey - 物品标识
 * @param cache - 已计算过的物品成本缓存
 * @param visiting - 当前递归路径上正在访问的物品集合（检测循环）
 * @returns 单位生产成本，无法计算时返回 null
 */
function calculateUnitProductionCost(
  itemKey: ItemKey,
  cache: Map<ItemKey, number>,
  visiting: Set<ItemKey>,
): number | null {
  const normalizedItemKey = normalizeItemKey(itemKey);
  // 货币的成本恒为 1（基准单位）
  if (normalizedItemKey === "money") {
    return 1;
  }
  const cached = cache.get(normalizedItemKey);
  if (cached !== undefined) {
    return cached;
  }
  // 检测循环依赖：如果当前物品已在递归链上，跳过避免死循环
  if (visiting.has(normalizedItemKey)) {
    return null;
  }

  visiting.add(normalizedItemKey);
  // 查找所有能产出该物品的配方
  const recipes = listRecipes().filter((recipe) =>
    recipe.outputs.some((output) => normalizeItemKey(output.itemKey) === normalizedItemKey),
  );

  // 遍历所有配方，选取总成本最低的路线
  let minUnitCost: number | null = null;
  for (const recipe of recipes) {
    const output = recipe.outputs.find(
      (item) => normalizeItemKey(item.itemKey) === normalizedItemKey,
    );
    if (!output || output.quantity <= 0) {
      continue;
    }

    let totalInputCost = 0;
    let isComputable = true;
    for (const input of recipe.inputs) {
      const inputUnitCost = calculateUnitProductionCost(input.itemKey, cache, visiting);
      if (inputUnitCost === null) {
        isComputable = false;
        break;
      }
      totalInputCost += inputUnitCost * input.quantity;
    }
    if (!isComputable) {
      continue;
    }

    const unitCost = totalInputCost / output.quantity;
    if (minUnitCost === null || unitCost < minUnitCost) {
      minUnitCost = unitCost;
    }
  }

  visiting.delete(normalizedItemKey);
  if (minUnitCost !== null) {
    cache.set(normalizedItemKey, minUnitCost);
  }
  return minUnitCost;
}

/**
 * 执行 Bot1 管理员创建收购订单步骤
 *
 * 流程：查找 bot -> 获取收购站 -> 解析目标配方原料 -> 扣除已有订单 -> 按预算创建新订单
 */
export async function executeBot1ManagerBuyOrdersStep(input: {
  deps: ExecuteBot1ManagerBuyOrdersStepDeps;
}): Promise<ExecuteBot1ManagerBuyOrdersStepResult> {
  const bot = await input.deps.userRepository.findByUsername(
    Username.create(BOT1_MANAGER_PERSONA_CONFIG.username),
  );
  if (!bot) {
    return {
      ok: false,
      error: "bot1-manager 尚未初始化，请先执行 bot1-manager 步骤",
      code: "BAD_REQUEST",
    };
  }

  const buildings = await input.deps.buildingRepository.findByOwnerUserId(bot.id);
  const purchasingStation = buildings.find((building) => building.type === "purchasing_station");
  if (!purchasingStation) {
    return {
      ok: false,
      error: "bot1-manager 尚未建造收购站，请先执行 bot1-manager-purchasing-station-build 步骤",
      code: "BAD_REQUEST",
    };
  }

  const targetRecipe = listRecipes().find((recipe) => recipe.id === TARGET_RECIPE_ID);
  if (!targetRecipe) {
    return {
      ok: false,
      error: "目标配方不存在：craft_land_reclamation_badge",
      code: "CONFLICT",
    };
  }

  // 汇总收购站现有活跃订单的数量，按物品分组
  const activeOrders = await input.deps.buyOrderRepository.findActiveByBuildingId(purchasingStation.id);
  const activeOrderQuantityByItem = new Map<ItemKey, number>();
  for (const order of activeOrders) {
    const key = normalizeItemKey(order.itemKey);
    activeOrderQuantityByItem.set(key, (activeOrderQuantityByItem.get(key) ?? 0) + order.quantity);
  }

  const costCache = new Map<ItemKey, number>();
  let budget = bot.money; // 剩余预算，每次下单后扣减
  let createdOrdersCount = 0;
  let orderedItemsCount = 0;

  // 遍历目标配方的每种原材料，按需创建收购订单
  for (const ingredient of targetRecipe.inputs) {
    const itemKey = normalizeItemKey(ingredient.itemKey);
    // 跳过货币类型的原材料
    if (itemKey === "money") {
      continue;
    }

    // 计算去除已有订单后仍需收购的数量
    const existingQuantity = activeOrderQuantityByItem.get(itemKey) ?? 0;
    const remainingNeededQuantity = Math.max(0, ingredient.quantity - existingQuantity);
    if (remainingNeededQuantity <= 0) {
      continue;
    }

    // 计算单位生产成本并加价，确定收购单价
    const unitProductionCost = calculateUnitProductionCost(itemKey, costCache, new Set<ItemKey>());
    if (unitProductionCost === null) {
      continue;
    }
    const unitPrice = Math.max(1, Math.ceil(unitProductionCost * (1 + BUY_ORDER_MARKUP_RATE)));
    // 根据预算计算可承受的最大数量
    const affordableQuantity = Math.floor(budget / unitPrice);
    const orderQuantity = Math.min(remainingNeededQuantity, affordableQuantity);
    if (orderQuantity <= 0) {
      continue;
    }

    const createOrderResult = await executeCreateBuyOrderUseCase(
      {
        buyerUserId: bot.id,
        buildingId: purchasingStation.id,
        itemKey,
        quantity: orderQuantity,
        unitPrice,
      },
      {
        buildingRepository: input.deps.buildingRepository,
        buyOrderRepository: input.deps.buyOrderRepository,
        userRepository: input.deps.userRepository,
        financeService: input.deps.financeService,
        plotRepository: input.deps.plotRepository,
        transact: input.deps.transact,
      },
    );
    if (!createOrderResult.ok) {
      continue;
    }

    budget -= orderQuantity * unitPrice;
    createdOrdersCount += 1;
    orderedItemsCount += orderQuantity;
    activeOrderQuantityByItem.set(itemKey, existingQuantity + orderQuantity);
  }

  return {
    createdOrdersCount,
    orderedItemsCount,
  };
}
