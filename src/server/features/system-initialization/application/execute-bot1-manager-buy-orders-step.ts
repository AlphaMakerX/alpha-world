import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import { normalizeItemKey } from "@/server/features/item/domain/value-objects/item-stack";
import { BOT1_MANAGER_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { Username } from "@/server/features/person/domain/value-objects/username";
import { executeCreateBuyOrderUseCase } from "@/server/features/purchasing-station/application/create-buy-order-use-case";
import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import { listRecipes } from "@/server/features/recipe/application/recipe-catalog";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";

const TARGET_RECIPE_ID = "craft_land_reclamation_badge";
const BUY_ORDER_MARKUP_RATE = 0.2;

type ExecuteBot1ManagerBuyOrdersStepDeps = {
  userRepository: UserRepository;
  buildingRepository: BuildingRepository;
  buyOrderRepository: BuyOrderRepository;
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

function calculateUnitProductionCost(
  itemKey: string,
  cache: Map<string, number>,
  visiting: Set<string>,
): number | null {
  const normalizedItemKey = normalizeItemKey(itemKey);
  if (normalizedItemKey === "money") {
    return 1;
  }
  const cached = cache.get(normalizedItemKey);
  if (cached !== undefined) {
    return cached;
  }
  if (visiting.has(normalizedItemKey)) {
    return null;
  }

  visiting.add(normalizedItemKey);
  const recipes = listRecipes().filter((recipe) =>
    recipe.outputs.some((output) => normalizeItemKey(output.itemKey) === normalizedItemKey),
  );

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

  const activeOrders = await input.deps.buyOrderRepository.findActiveByBuildingId(purchasingStation.id);
  const activeOrderQuantityByItem = new Map<string, number>();
  for (const order of activeOrders) {
    const key = normalizeItemKey(order.itemKey);
    activeOrderQuantityByItem.set(key, (activeOrderQuantityByItem.get(key) ?? 0) + order.quantity);
  }

  const costCache = new Map<string, number>();
  let budget = bot.money;
  let createdOrdersCount = 0;
  let orderedItemsCount = 0;

  for (const ingredient of targetRecipe.inputs) {
    const itemKey = normalizeItemKey(ingredient.itemKey);
    if (itemKey === "money") {
      continue;
    }

    const existingQuantity = activeOrderQuantityByItem.get(itemKey) ?? 0;
    const remainingNeededQuantity = Math.max(0, ingredient.quantity - existingQuantity);
    if (remainingNeededQuantity <= 0) {
      continue;
    }

    const unitProductionCost = calculateUnitProductionCost(itemKey, costCache, new Set<string>());
    if (unitProductionCost === null) {
      continue;
    }
    const unitPrice = Math.max(1, Math.ceil(unitProductionCost * (1 + BUY_ORDER_MARKUP_RATE)));
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
