import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

type CancelBuyOrderSuccessResult = {
  ok: true;
  order: { id: number; itemKey: string; quantity: number };
};

type CancelBuyOrderFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type CancelBuyOrderResult = CancelBuyOrderSuccessResult | CancelBuyOrderFailureResult;

export type CancelBuyOrderCommand = {
  buyerUserId: string;
  orderId: number;
};

export type CancelBuyOrderUseCaseDeps = {
  buyOrderRepository: BuyOrderRepository;
  userRepository: UserRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executeCancelBuyOrderUseCase(
  command: CancelBuyOrderCommand,
  deps: CancelBuyOrderUseCaseDeps,
): Promise<CancelBuyOrderResult> {
  const order = await deps.buyOrderRepository.findById(command.orderId);
  if (!order) {
    return { ok: false, error: "收购订单不存在", code: "NOT_FOUND" };
  }

  if (order.status !== "active") {
    return { ok: false, error: "该订单已完成或已取消", code: "CONFLICT" };
  }

  if (order.buyerUserId !== command.buyerUserId) {
    return { ok: false, error: "只有收购方本人才能取消订单", code: "CONFLICT" };
  }

  const buyer = await deps.userRepository.findById(order.buyerUserId);
  if (!buyer) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  const refundAmount = order.unitPrice * order.quantity;
  await deps.transact(async () => {
    buyer.receiveMoney(refundAmount);
    await deps.userRepository.save(buyer);
    await deps.buyOrderRepository.updateStatus(order.id, "cancelled");
  });

  return {
    ok: true,
    order: {
      id: order.id,
      itemKey: order.itemKey,
      quantity: order.quantity,
    },
  };
}
