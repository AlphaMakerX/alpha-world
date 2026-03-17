import type { ShopListingRepository } from "@/server/features/shop/domain/repositories/shop-listing-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

type CancelShopListingSuccessResult = {
  ok: true;
  listing: { id: number; itemKey: string; quantity: number };
};

type CancelShopListingFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type CancelShopListingResult =
  | CancelShopListingSuccessResult
  | CancelShopListingFailureResult;

export type CancelShopListingCommand = {
  sellerUserId: string;
  listingId: number;
};

export type CancelShopListingUseCaseDeps = {
  shopListingRepository: ShopListingRepository;
  inventoryRepository: InventoryRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executeCancelShopListingUseCase(
  command: CancelShopListingCommand,
  deps: CancelShopListingUseCaseDeps,
): Promise<CancelShopListingResult> {
  const listing = await deps.shopListingRepository.findById(command.listingId);
  if (!listing) {
    return { ok: false, error: "商品不存在", code: "NOT_FOUND" };
  }

  if (listing.status !== "active") {
    return { ok: false, error: "该商品已下架或已售出，无法取消", code: "CONFLICT" };
  }

  if (listing.sellerUserId !== command.sellerUserId) {
    return { ok: false, error: "只有卖家本人才能下架商品", code: "CONFLICT" };
  }

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
