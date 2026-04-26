/**
 * 取消商店上架商品用例
 *
 * 卖家取消自己在商店中上架的商品，将商品状态标记为已取消，
 * 并将库存退还给卖家。整个操作在事务中执行以保证数据一致性。
 */

import type { ShopListing, ShopListingRepository } from "@/server/features/shop/domain/repositories/shop-listing-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 取消上架成功的返回结果 */
type CancelShopListingSuccessResult = {
  ok: true;
  listing: { id: number; itemKey: string; quantity: number };
};

/** 取消上架失败的返回结果 */
type CancelShopListingFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 取消上架用例的返回结果联合类型 */
export type CancelShopListingResult =
  | CancelShopListingSuccessResult
  | CancelShopListingFailureResult;

/** 取消上架命令参数 */
export type CancelShopListingCommand = {
  /** 卖家用户 ID */
  sellerUserId: string;
  /** 上架商品 ID */
  listingId: number;
};

/** 取消上架用例的依赖 */
export type CancelShopListingUseCaseDeps = {
  shopListingRepository: ShopListingRepository;
  inventoryRepository: InventoryRepository;
  /** 事务执行器，确保状态更新和库存退还的原子性 */
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 校验通过后传递给业务逻辑的上下文 */
type ValidatedContext = { listing: ShopListing };

async function validate(
  command: CancelShopListingCommand,
  deps: CancelShopListingUseCaseDeps,
): Promise<ValidatedContext | CancelShopListingFailureResult> {
  const listing = await deps.shopListingRepository.findById(command.listingId);
  if (!listing) {
    return { ok: false, error: "商品不存在", code: "NOT_FOUND" };
  }

  if (listing.status !== "active") {
    return { ok: false, error: "该商品已下架或已售出，无法取消", code: "CONFLICT" };
  }

  // 只有卖家本人才能取消上架
  if (listing.sellerUserId !== command.sellerUserId) {
    return { ok: false, error: "只有卖家本人才能下架商品", code: "CONFLICT" };
  }

  return { listing };
}

function isFailure(
  result: ValidatedContext | CancelShopListingFailureResult,
): result is CancelShopListingFailureResult {
  return "ok" in result;
}

/**
 * 执行取消商店上架商品用例
 *
 * 流程：校验商品存在性 -> 校验状态为在售 -> 校验操作者为卖家本人
 * -> 在事务中将状态设为已取消并退还库存
 */
export async function executeCancelShopListingUseCase(
  command: CancelShopListingCommand,
  deps: CancelShopListingUseCaseDeps,
): Promise<CancelShopListingResult> {
  const validated = await validate(command, deps);
  if (isFailure(validated)) return validated;
  const { listing } = validated;

  // 事务：标记商品为已取消 + 将物品退还到卖家库存
  await deps.transact(async () => {
    await deps.shopListingRepository.updateStatus(listing.id, "cancelled");
    await deps.inventoryRepository.addItem(
      listing.sellerUserId,
      listing.itemKey,
      listing.quantity,
    );
  });

  return {
    ok: true,
    listing: {
      id: listing.id,
      itemKey: listing.itemKey,
      quantity: listing.quantity,
    },
  };
}
