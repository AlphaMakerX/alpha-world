import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { shopListingRepository, inventoryRepository } from "@/server/features/building/infrastructure";
import { userRepository, transactionLedgerRepository } from "@/server/features/person/infrastructure";

const purchaseShopListingSchema = z.object({
  buyerUserId: z.string().uuid("用户 ID 不合法"),
  listingId: z.number().int().positive(),
});

type PurchaseShopListingSuccessResult = {
  ok: true;
  listing: {
    id: number;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
  };
};

type PurchaseShopListingFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type PurchaseShopListingResult =
  | PurchaseShopListingSuccessResult
  | PurchaseShopListingFailureResult;

export async function executePurchaseShopListingUseCase(
  input: unknown,
): Promise<PurchaseShopListingResult> {
  const parsed = purchaseShopListingSchema.safeParse(input);
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
    return { ok: false, error: "该商品已下架或已售出", status: 409 };
  }

  if (listing.sellerUserId === parsed.data.buyerUserId) {
    return { ok: false, error: "不能购买自己上架的商品", status: 409 };
  }

  const buyer = await userRepository.findById(parsed.data.buyerUserId);
  if (!buyer) {
    return { ok: false, error: "用户不存在", status: 404 };
  }

  const seller = await userRepository.findById(listing.sellerUserId);
  if (!seller) {
    return { ok: false, error: "卖家不存在", status: 404 };
  }

  const totalCost = listing.unitPrice * listing.quantity;

  try {
    buyer.spendMoney(totalCost);
    seller.receiveMoney(totalCost);
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, status: 409 };
    }
    throw error;
  }

  await userRepository.save(buyer);
  await userRepository.save(seller);
  await shopListingRepository.updateStatus(listing.id, "sold");
  await inventoryRepository.addItem(
    parsed.data.buyerUserId,
    listing.itemKey,
    listing.quantity,
  );

  await transactionLedgerRepository.record({
    fromUserId: parsed.data.buyerUserId,
    toUserId: listing.sellerUserId,
    amount: totalCost,
    type: "shop_purchase",
    referenceId: String(listing.id),
    description: `购买商品: ${listing.itemKey} x${listing.quantity}`,
  });

  return {
    ok: true,
    listing: {
      id: listing.id,
      itemKey: listing.itemKey,
      quantity: listing.quantity,
      unitPrice: listing.unitPrice,
      totalCost,
    },
  };
}
