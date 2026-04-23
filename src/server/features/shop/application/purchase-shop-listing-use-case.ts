/**
 * 购买商店上架商品用例
 *
 * 买家从商店购买在售商品。购买时会进行资金转移（买家扣款、卖家收款），
 * 更新商品库存或状态，将物品添加到买家库存，并记录交易流水。
 */

import { getItemName } from "@/server/features/item/item-catalog";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { ShopListingRepository } from "@/server/features/shop/domain/repositories/shop-listing-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 购买成功的返回结果 */
type PurchaseShopListingSuccessResult = {
  ok: true;
  listing: {
    id: number;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    /** 总花费 = 单价 * 购买数量 */
    totalCost: number;
  };
};

/** 购买失败的返回结果 */
type PurchaseShopListingFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 购买商品用例的返回结果联合类型 */
export type PurchaseShopListingResult =
  | PurchaseShopListingSuccessResult
  | PurchaseShopListingFailureResult;

/** 购买商品命令参数 */
export type PurchaseShopListingCommand = {
  /** 买家用户 ID */
  buyerUserId: string;
  /** 上架商品 ID */
  listingId: number;
  /** 购买数量 */
  quantity: number;
};

/** 购买商品用例的依赖 */
export type PurchaseShopListingUseCaseDeps = {
  shopListingRepository: ShopListingRepository;
  inventoryRepository: InventoryRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  /** 事务执行器，确保资金转移、库存变更和流水记录的原子性 */
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/**
 * 执行购买商店上架商品用例
 *
 * 流程：校验商品存在且在售 -> 禁止自买 -> 校验购买数量 -> 查找买卖双方用户
 * -> 资金扣款/收款 -> 事务中持久化所有变更并记录交易流水
 */
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

  // 不允许购买自己上架的商品
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
    // 在领域模型层执行资金变动（余额不足时会抛出 DomainError）
    buyer.spendMoney(totalCost);
    seller.receiveMoney(totalCost);
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  // 事务：保存买卖双方余额 + 更新商品状态/数量 + 添加买家库存 + 记录交易流水
  await deps.transact(async () => {
    await deps.userRepository.save(buyer);
    await deps.userRepository.save(seller);

    // 若全部售出则标记为 sold，否则仅减少数量
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

    // 记录交易流水
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
