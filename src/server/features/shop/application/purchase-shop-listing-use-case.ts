import { getItemName } from "@/server/features/item/item-catalog";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { ShopListingRepository } from "@/server/features/shop/domain/repositories/shop-listing-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

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
  code: UseCaseErrorCode;
};

export type PurchaseShopListingResult =
  | PurchaseShopListingSuccessResult
  | PurchaseShopListingFailureResult;

export type PurchaseShopListingCommand = {
  buyerUserId: string;
  listingId: number;
  quantity: number;
};

export type PurchaseShopListingUseCaseDeps = {
  shopListingRepository: ShopListingRepository;
  inventoryRepository: InventoryRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executePurchaseShopListingUseCase(
  command: PurchaseShopListingCommand,
  deps: PurchaseShopListingUseCaseDeps,
): Promise<PurchaseShopListingResult> {
  const listing = await deps.shopListingRepository.findById(command.listingId);
  if (!listing) {
    return { ok: false, error: "商品不存在", code: "NOT_FOUND" };
  }

  if (listing.status !== "active") {
    return { ok: false, error: "该商品已下架或已售出", code: "CONFLICT" };
  }

  if (listing.sellerUserId === command.buyerUserId) {
    return { ok: false, error: "不能购买自己上架的商品", code: "CONFLICT" };
  }

  const purchaseQuantity = command.quantity;
  if (purchaseQuantity > listing.quantity) {
    return { ok: false, error: `购买数量不能超过剩余库存 (${listing.quantity})`, code: "CONFLICT" };
  }

  const buyer = await deps.userRepository.findById(command.buyerUserId);
  if (!buyer) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  const seller = await deps.userRepository.findById(listing.sellerUserId);
  if (!seller) {
    return { ok: false, error: "卖家不存在", code: "NOT_FOUND" };
  }

  const totalCost = listing.unitPrice * purchaseQuantity;

  try {
    buyer.spendMoney(totalCost);
    seller.receiveMoney(totalCost);
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  await deps.transact(async () => {
    await deps.userRepository.save(buyer);
    await deps.userRepository.save(seller);

    const remainingQuantity = listing.quantity - purchaseQuantity;
    if (remainingQuantity === 0) {
      await deps.shopListingRepository.updateStatus(listing.id, "sold");
    } else {
      await deps.shopListingRepository.updateQuantity(listing.id, remainingQuantity);
    }

    await deps.inventoryRepository.addItem(
      command.buyerUserId,
      listing.itemKey,
      purchaseQuantity,
    );

    await deps.transactionLedgerRepository.record({
      fromUserId: command.buyerUserId,
      toUserId: listing.sellerUserId,
      amount: totalCost,
      type: "shop_purchase",
      referenceId: String(listing.id),
      description: `购买商品: ${getItemName(listing.itemKey)} x${purchaseQuantity}`,
    });
  });

  return {
    ok: true,
    listing: {
      id: listing.id,
      itemKey: listing.itemKey,
      quantity: purchaseQuantity,
      unitPrice: listing.unitPrice,
      totalCost,
    },
  };
}
