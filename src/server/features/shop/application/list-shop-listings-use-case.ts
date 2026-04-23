/**
 * 查询商店在售商品列表用例
 *
 * 查询指定商店建筑中所有当前在售的上架商品列表。
 */

import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { ShopListingRepository } from "@/server/features/shop/domain/repositories/shop-listing-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 查询成功的返回结果 */
type ListShopListingsSuccessResult = {
  ok: true;
  listings: Array<{
    id: number;
    buildingId: number;
    sellerUserId: string;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    status: "active" | "sold" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
  }>;
};

/** 查询失败的返回结果 */
type ListShopListingsFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 查询在售商品列表用例的返回结果联合类型 */
export type ListShopListingsResult = ListShopListingsSuccessResult | ListShopListingsFailureResult;

/** 查询在售商品列表命令参数 */
export type ListShopListingsCommand = {
  /** 商店建筑 ID */
  buildingId: number;
};

/** 查询在售商品列表用例的依赖 */
export type ListShopListingsUseCaseDeps = {
  buildingRepository: BuildingRepository;
  shopListingRepository: ShopListingRepository;
};

/**
 * 执行查询商店在售商品列表用例
 *
 * 流程：校验建筑存在 -> 确认建筑为商店类型 -> 查询所有在售商品
 */
export async function executeListShopListingsUseCase(
  command: ListShopListingsCommand,
  deps: ListShopListingsUseCaseDeps,
): Promise<ListShopListingsResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return {
      ok: false,
      error: "建筑不存在",
      code: "NOT_FOUND",
    };
  }

  try {
    // 确认该建筑是商店类型
    building.ensureShop();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  const listings = await deps.shopListingRepository.findActiveByBuildingId(command.buildingId);

  return {
    ok: true,
    listings,
  };
}
