/**
 * 履行收购订单用例（出售物品给收购站）
 *
 * 卖家向收购站的收购订单出售物品。出售时会从卖家库存扣除物品，
 * 将物品添加到收购方库存，将预冻结的资金转给卖家，并记录交易流水。
 * 支持部分成交（出售数量可小于订单需求数量）。
 */

import { getItemName } from "@/server/features/item/item-catalog";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { BuyOrder, BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { User } from "@/server/features/person/domain/entities/user";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { FinanceService } from "@/server/features/finance/domain/finance-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 履行收购订单成功的返回结果 */
type FulfillBuyOrderSuccessResult = {
  ok: true;
  order: {
    id: number;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    /** 卖家总收入 = 单价 * 出售数量 */
    totalIncome: number;
  };
};

/** 履行收购订单失败的返回结果 */
type FulfillBuyOrderFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 履行收购订单用例的返回结果联合类型 */
export type FulfillBuyOrderResult = FulfillBuyOrderSuccessResult | FulfillBuyOrderFailureResult;

/** 履行收购订单命令参数 */
export type FulfillBuyOrderCommand = {
  /** 卖家用户 ID */
  sellerUserId: string;
  /** 收购订单 ID */
  orderId: number;
  /** 出售数量 */
  quantity: number;
};

/** 履行收购订单用例的依赖 */
export type FulfillBuyOrderUseCaseDeps = {
  buyOrderRepository: BuyOrderRepository;
  inventoryRepository: InventoryRepository;
  userRepository: UserRepository;
  financeService: FinanceService;
  /** 事务执行器，确保库存转移、资金转移和流水记录的原子性 */
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** validate 返回的已校验上下文，包含业务逻辑所需的数据 */
type ValidatedContext = {
  order: BuyOrder;
  seller: User;
  sellQuantity: number;
  totalIncome: number;
};

async function validate(
  command: FulfillBuyOrderCommand,
  deps: FulfillBuyOrderUseCaseDeps,
): Promise<ValidatedContext | FulfillBuyOrderFailureResult> {
  const order = await deps.buyOrderRepository.findById(command.orderId);
  if (!order) {
    return { ok: false, error: "收购订单不存在", code: "NOT_FOUND" };
  }

  if (order.status !== "active") {
    return { ok: false, error: "该订单已完成或已取消", code: "CONFLICT" };
  }

  // 不允许向自己的收购订单出售
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

  // 校验卖家库存是否充足
  const sellerQuantity = await deps.inventoryRepository.getItemQuantity(
    command.sellerUserId,
    order.itemKey,
  );
  if (sellerQuantity < sellQuantity) {
    return { ok: false, error: "库存不足，无法出售", code: "CONFLICT" };
  }

  const totalIncome = order.unitPrice * sellQuantity;

  return { order, seller, sellQuantity, totalIncome };
}

function isFailure(
  result: ValidatedContext | FulfillBuyOrderFailureResult,
): result is FulfillBuyOrderFailureResult {
  return "ok" in result;
}

/**
 * 执行履行收购订单用例
 *
 * 流程：校验订单存在且进行中 -> 禁止自卖 -> 校验出售数量 -> 校验卖家库存
 * -> 卖家收款 -> 事务中扣除/添加库存、更新订单状态、记录交易流水
 */
export async function executeFulfillBuyOrderUseCase(
  command: FulfillBuyOrderCommand,
  deps: FulfillBuyOrderUseCaseDeps,
): Promise<FulfillBuyOrderResult> {
  const validated = await validate(command, deps);
  if (isFailure(validated)) return validated;
  const { order, seller, sellQuantity, totalIncome } = validated;

  // 事务：扣除卖家库存 + 添加收购方库存 + 释放冻结资金给卖家 + 更新订单状态
  try {
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

      // 释放收购方预冻结的资金给卖家
      await deps.financeService.release({
        recipient: seller,
        frozenByUserId: order.buyerUserId,
        amount: totalIncome,
        type: "buy_order_fulfilled",
        referenceId: String(order.id),
        description: `收购订单成交: ${getItemName(order.itemKey)} x${sellQuantity}`,
      });

      // 若全部成交则标记为 fulfilled，否则仅减少剩余需求数量
      const remainingQuantity = order.quantity - sellQuantity;
      if (remainingQuantity === 0) {
        await deps.buyOrderRepository.updateStatus(order.id, "fulfilled");
      } else {
        await deps.buyOrderRepository.updateQuantity(order.id, remainingQuantity);
      }
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

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
