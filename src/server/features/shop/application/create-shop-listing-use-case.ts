/**
 * 创建商店上架商品用例
 *
 * 卖家将自己库存中的物品上架到所属地块的商店建筑中进行出售。
 * 上架时会从卖家库存中扣除相应数量，创建在售的上架记录。
 */

import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { normalizeItemKey } from "@/server/features/item/domain/value-objects/item-stack";
import type { ItemKey } from "@/server/features/item/item-catalog";
import type { Building } from "@/server/features/building/domain";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { ShopListingRepository } from "@/server/features/shop/domain/repositories/shop-listing-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 创建上架成功的返回结果 */
type CreateShopListingSuccessResult = {
  ok: true;
  listing: {
    id: number;
    buildingId: number;
    sellerUserId: string;
    itemKey: ItemKey;
    quantity: number;
    unitPrice: number;
    status: "active" | "sold" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
  };
};

/** 创建上架失败的返回结果 */
type CreateShopListingFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 创建上架用例的返回结果联合类型 */
export type CreateShopListingResult = CreateShopListingSuccessResult | CreateShopListingFailureResult;

/** 创建上架命令参数 */
export type CreateShopListingCommand = {
  /** 卖家用户 ID */
  sellerUserId: string;
  /** 目标商店建筑 ID */
  buildingId: number;
  /** 物品标识键 */
  itemKey: ItemKey;
  /** 上架数量 */
  quantity: number;
  /** 单价 */
  unitPrice: number;
};

/** 创建上架用例的依赖 */
export type CreateShopListingUseCaseDeps = {
  buildingRepository: BuildingRepository;
  shopListingRepository: ShopListingRepository;
  inventoryRepository: InventoryRepository;
  plotRepository: PlotRepository;
  /** 事务执行器，确保扣减库存和创建上架记录的原子性 */
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 校验通过后传递给业务逻辑的上下文 */
type ValidatedContext = { building: Building; normalizedItemKey: ItemKey };

async function validate(
  command: CreateShopListingCommand,
  deps: CreateShopListingUseCaseDeps,
): Promise<ValidatedContext | CreateShopListingFailureResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return {
      ok: false,
      error: "建筑不存在",
      code: "NOT_FOUND",
    };
  }

  // 校验地块存在且归属于卖家
  const plot = await deps.plotRepository.findById(building.plotId);
  if (!plot) {
    return {
      ok: false,
      error: "地块不存在",
      code: "NOT_FOUND",
    };
  }
  if (plot.ownerUserId !== command.sellerUserId) {
    return {
      ok: false,
      error: "只能操作自己地块上的商店",
      code: "CONFLICT",
    };
  }
  // 确认该建筑是商店类型，否则抛出 DomainError
  building.ensureShop();

  // 标准化物品键并检查卖家库存
  const normalizedItemKey = normalizeItemKey(command.itemKey);
  const quantity = await deps.inventoryRepository.getItemQuantity(command.sellerUserId, normalizedItemKey);
  if (quantity < command.quantity) {
    return {
      ok: false,
      error: "库存不足，无法上架",
      code: "CONFLICT",
    };
  }

  return { building, normalizedItemKey };
}

function isFailure(
  result: ValidatedContext | CreateShopListingFailureResult,
): result is CreateShopListingFailureResult {
  return "ok" in result;
}

/**
 * 执行创建商店上架商品用例
 *
 * 流程：校验建筑存在 -> 校验地块归属 -> 确认建筑为商店类型
 * -> 校验卖家库存充足 -> 事务中扣减库存并创建上架记录
 */
export async function executeCreateShopListingUseCase(
  command: CreateShopListingCommand,
  deps: CreateShopListingUseCaseDeps,
): Promise<CreateShopListingResult> {
  try {
    const validated = await validate(command, deps);
    if (isFailure(validated)) return validated;
    const { building, normalizedItemKey } = validated;

    // 事务：从卖家库存扣除物品 + 创建上架记录
    const listing = await deps.transact(async () => {
      await deps.inventoryRepository.consumeItem(
        command.sellerUserId,
        normalizedItemKey,
        command.quantity,
      );

      return deps.shopListingRepository.create({
        buildingId: building.id,
        sellerUserId: command.sellerUserId,
        itemKey: normalizedItemKey,
        quantity: command.quantity,
        unitPrice: command.unitPrice,
        status: "active",
      });
    });

    return {
      ok: true,
      listing,
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        ok: false,
        error: error.message,
        code: "CONFLICT",
      };
    }
    throw error;
  }
}
