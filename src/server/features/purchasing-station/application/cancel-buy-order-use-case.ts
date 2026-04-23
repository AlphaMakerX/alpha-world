/**
 * 取消收购订单用例
 *
 * 收购方取消自己发布的收购订单，将订单状态标记为已取消，
 * 并将预冻结的资金退还给收购方。整个操作在事务中执行以保证数据一致性。
 */

import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 取消收购订单成功的返回结果 */
type CancelBuyOrderSuccessResult = {
  ok: true;
  order: { id: number; itemKey: string; quantity: number };
};

/** 取消收购订单失败的返回结果 */
type CancelBuyOrderFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 取消收购订单用例的返回结果联合类型 */
export type CancelBuyOrderResult = CancelBuyOrderSuccessResult | CancelBuyOrderFailureResult;

/** 取消收购订单命令参数 */
export type CancelBuyOrderCommand = {
  /** 收购方用户 ID */
  buyerUserId: string;
  /** 收购订单 ID */
  orderId: number;
};

/** 取消收购订单用例的依赖 */
export type CancelBuyOrderUseCaseDeps = {
  buyOrderRepository: BuyOrderRepository;
  userRepository: UserRepository;
  /** 事务执行器，确保退款和状态更新的原子性 */
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/**
 * 执行取消收购订单用例
 *
 * 流程：校验订单存在 -> 校验订单状态为进行中 -> 校验操作者为收购方本人
 * -> 计算退款金额 -> 事务中退款并标记订单为已取消
 */
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

  // 只有收购方本人才能取消订单
  if (order.buyerUserId !== command.buyerUserId) {
    return { ok: false, error: "只有收购方本人才能取消订单", code: "CONFLICT" };
  }

  const buyer = await deps.userRepository.findById(order.buyerUserId);
  if (!buyer) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  // 计算应退还金额 = 单价 * 剩余需求数量
  const refundAmount = order.unitPrice * order.quantity;
  // 事务：退还资金 + 将订单标记为已取消
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
