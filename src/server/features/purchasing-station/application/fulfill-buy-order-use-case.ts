import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

type FulfillBuyOrderSuccessResult = {
  ok: true;
  order: {
    id: number;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    totalIncome: number;
  };
};

type FulfillBuyOrderFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type FulfillBuyOrderResult = FulfillBuyOrderSuccessResult | FulfillBuyOrderFailureResult;

export type FulfillBuyOrderCommand = {
  sellerUserId: string;
  orderId: number;
  quantity: number;
};

export type FulfillBuyOrderUseCaseDeps = {
  buyOrderRepository: BuyOrderRepository;
  inventoryRepository: InventoryRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executeFulfillBuyOrderUseCase(
  command: FulfillBuyOrderCommand,
  deps: FulfillBuyOrderUseCaseDeps,
): Promise<FulfillBuyOrderResult> {
  const order = await deps.buyOrderRepository.findById(command.orderId);
  if (!order) {
    return { ok: false, error: "收购订单不存在", code: "NOT_FOUND" };
  }

  if (order.status !== "active") {
    return { ok: false, error: "该订单已完成或已取消", code: "CONFLICT" };
  }

  if (order.buyerUserId === command.sellerUserId) {
    return { ok: false, error: "不能出售给自己的收购订单", code: "CONFLICT" };
  }

  const sellQuantity = command.quantity;
  if (sellQuantity > order.quantity) {
    return { ok: false, error: `出售数量不能超过订单剩余需求 (${order.quantity})`, code: "CONFLICT" };
  }

  const seller = await deps.userRepository.findById(command.sellerUserId);
  if (!seller) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  const sellerQuantity = await deps.inventoryRepository.getItemQuantity(
    command.sellerUserId,
    order.itemKey,
  );
  if (sellerQuantity < sellQuantity) {
    return { ok: false, error: "库存不足，无法出售", code: "CONFLICT" };
  }

  const totalIncome = order.unitPrice * sellQuantity;

  try {
    seller.receiveMoney(totalIncome);
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  await deps.transact(async () => {
    await deps.inventoryRepository.consumeItem(
      command.sellerUserId,
      order.itemKey,
      sellQuantity,
    );
    await deps.inventoryRepository.addItem(
      order.buyerUserId,
      order.itemKey,
      sellQuantity,
    );
    await deps.userRepository.save(seller);

    const remainingQuantity = order.quantity - sellQuantity;
    if (remainingQuantity === 0) {
      await deps.buyOrderRepository.updateStatus(order.id, "fulfilled");
    } else {
      await deps.buyOrderRepository.updateQuantity(order.id, remainingQuantity);
    }

    await deps.transactionLedgerRepository.record({
      fromUserId: order.buyerUserId,
      toUserId: command.sellerUserId,
      amount: totalIncome,
      type: "buy_order_fulfilled",
      referenceId: String(order.id),
      description: `收购订单成交: ${order.itemKey} x${sellQuantity}`,
    });
  });

  return {
    ok: true,
    order: {
      id: order.id,
      itemKey: order.itemKey,
      quantity: sellQuantity,
      unitPrice: order.unitPrice,
      totalIncome,
    },
  };
}
