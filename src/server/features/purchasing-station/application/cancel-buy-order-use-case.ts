/**
 * 取消收购订单用例
 *
 * 收购方取消自己发布的收购订单，将订单状态标记为已取消，
 * 并将预冻结的资金退还给收购方。整个操作在事务中执行以保证数据一致性。
 */

import type { ItemKey } from "@/server/features/item/item-catalog";
import type { BuyOrderRepository, BuyOrder } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { User } from "@/server/features/person/domain/entities/user";
import type { FinanceService } from "@/server/features/finance/application/services/finance-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 取消收购订单成功的返回结果 */
type CancelBuyOrderSuccessResult = {
  ok: true;
  order: { id: number; itemKey: ItemKey; quantity: number };
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
  financeService: FinanceService;
  /** 事务执行器，确保退款和状态更新的原子性 */
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 校验通过后，后续逻辑需要的"已验证上下文" */
type ValidatedContext = {
  order: BuyOrder;
  buyer: User;
};

/** 校验取消收购订单前置条件，通过则返回已验证上下文，失败则返回错误结果 */
async function validate(
  command: CancelBuyOrderCommand,
  deps: CancelBuyOrderUseCaseDeps,
): Promise<ValidatedContext | CancelBuyOrderFailureResult> {
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

  return { order, buyer };
}

function isFailure(result: ValidatedContext | CancelBuyOrderFailureResult): result is CancelBuyOrderFailureResult {
  return "ok" in result;
}

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
  const validated = await validate(command, deps);
  if (isFailure(validated)) return validated;

  const { order, buyer } = validated;

  // 计算应退还金额 = 单价 * 剩余需求数量
  const refundAmount = order.unitPrice * order.quantity;
  // 事务：退还冻结资金 + 将订单标记为已取消
  await deps.transact(async () => {
    await deps.financeService.refund({ recipient: buyer, amount: refundAmount });
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
