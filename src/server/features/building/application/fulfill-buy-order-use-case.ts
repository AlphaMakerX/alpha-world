import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { buyOrderRepository, inventoryRepository } from "@/server/features/building/infrastructure";
import { userRepository, transactionLedgerRepository } from "@/server/features/person/infrastructure";

const fulfillBuyOrderSchema = z.object({
  sellerUserId: z.string().uuid("用户 ID 不合法"),
  orderId: z.number().int().positive(),
});

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
  status: 400 | 404 | 409;
};

export type FulfillBuyOrderResult = FulfillBuyOrderSuccessResult | FulfillBuyOrderFailureResult;

export async function executeFulfillBuyOrderUseCase(
  input: unknown,
): Promise<FulfillBuyOrderResult> {
  const parsed = fulfillBuyOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const order = await buyOrderRepository.findById(parsed.data.orderId);
  if (!order) {
    return { ok: false, error: "收购订单不存在", status: 404 };
  }

  if (order.status !== "active") {
    return { ok: false, error: "该订单已完成或已取消", status: 409 };
  }

  if (order.buyerUserId === parsed.data.sellerUserId) {
    return { ok: false, error: "不能出售给自己的收购订单", status: 409 };
  }

  const seller = await userRepository.findById(parsed.data.sellerUserId);
  if (!seller) {
    return { ok: false, error: "用户不存在", status: 404 };
  }

  const sellerQuantity = await inventoryRepository.getItemQuantity(
    parsed.data.sellerUserId,
    order.itemKey,
  );
  if (sellerQuantity < order.quantity) {
    return { ok: false, error: "库存不足，无法出售", status: 409 };
  }

  const totalIncome = order.unitPrice * order.quantity;

  try {
    seller.receiveMoney(totalIncome);
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, status: 409 };
    }
    throw error;
  }

  await inventoryRepository.consumeItem(
    parsed.data.sellerUserId,
    order.itemKey,
    order.quantity,
  );
  await inventoryRepository.addItem(
    order.buyerUserId,
    order.itemKey,
    order.quantity,
  );
  await userRepository.save(seller);
  await buyOrderRepository.updateStatus(order.id, "fulfilled");

  await transactionLedgerRepository.record({
    fromUserId: order.buyerUserId,
    toUserId: parsed.data.sellerUserId,
    amount: totalIncome,
    type: "buy_order_fulfilled",
    referenceId: String(order.id),
    description: `收购订单成交: ${order.itemKey} x${order.quantity}`,
  });

  return {
    ok: true,
    order: {
      id: order.id,
      itemKey: order.itemKey,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalIncome,
    },
  };
}
