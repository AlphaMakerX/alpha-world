import { z } from "zod";
import { buyOrderRepository } from "@/server/features/purchasing-station/infrastructure";
import { userRepository } from "@/server/features/person/infrastructure";

const cancelBuyOrderSchema = z.object({
  buyerUserId: z.string().uuid("用户 ID 不合法"),
  orderId: z.number().int().positive(),
});

type CancelBuyOrderSuccessResult = {
  ok: true;
  order: { id: number; itemKey: string; quantity: number };
};

type CancelBuyOrderFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type CancelBuyOrderResult = CancelBuyOrderSuccessResult | CancelBuyOrderFailureResult;

export async function executeCancelBuyOrderUseCase(
  input: unknown,
): Promise<CancelBuyOrderResult> {
  const parsed = cancelBuyOrderSchema.safeParse(input);
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

  if (order.buyerUserId !== parsed.data.buyerUserId) {
    return { ok: false, error: "只有收购方本人才能取消订单", status: 409 };
  }

  const buyer = await userRepository.findById(order.buyerUserId);
  if (!buyer) {
    return { ok: false, error: "用户不存在", status: 404 };
  }

  const refundAmount = order.unitPrice * order.quantity;
  buyer.receiveMoney(refundAmount);
  await userRepository.save(buyer);
  await buyOrderRepository.updateStatus(order.id, "cancelled");

  return {
    ok: true,
    order: {
      id: order.id,
      itemKey: order.itemKey,
      quantity: order.quantity,
    },
  };
}
