import { z } from "zod";
import { shopListingRepository } from "@/server/features/shop/infrastructure";
import { inventoryRepository } from "@/server/features/inventory/infrastructure";

const cancelShopListingSchema = z.object({
  sellerUserId: z.string().uuid("用户 ID 不合法"),
  listingId: z.number().int().positive(),
});

type CancelShopListingSuccessResult = {
  ok: true;
  listing: { id: number; itemKey: string; quantity: number };
};

type CancelShopListingFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type CancelShopListingResult =
  | CancelShopListingSuccessResult
  | CancelShopListingFailureResult;

export async function executeCancelShopListingUseCase(
  input: unknown,
): Promise<CancelShopListingResult> {
  const parsed = cancelShopListingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const listing = await shopListingRepository.findById(parsed.data.listingId);
  if (!listing) {
    return { ok: false, error: "商品不存在", status: 404 };
  }

  if (listing.status !== "active") {
    return { ok: false, error: "该商品已下架或已售出，无法取消", status: 409 };
  }

  if (listing.sellerUserId !== parsed.data.sellerUserId) {
    return { ok: false, error: "只有卖家本人才能下架商品", status: 409 };
  }

  await shopListingRepository.updateStatus(listing.id, "cancelled");
  await inventoryRepository.addItem(
    listing.sellerUserId,
    listing.itemKey,
    listing.quantity,
  );

  return {
    ok: true,
    listing: {
      id: listing.id,
      itemKey: listing.itemKey,
      quantity: listing.quantity,
    },
  };
}
