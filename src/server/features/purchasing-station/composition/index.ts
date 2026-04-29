/**
 * 收购站模块组合根（Composition Root）
 *
 * 负责将收购站相关的所有用例与具体的基础设施实现进行组装，
 * 对外暴露带有参数校验（Zod schema）的用例入口函数。
 * 调用方只需传入原始输入，组合根负责校验、依赖注入和执行。
 */

import { z } from "zod";
import type { ItemKey } from "@/server/features/item/item-catalog";
import {
  executeCreateBuyOrderUseCase as executeCreateBuyOrderUseCaseImpl,
  type CreateBuyOrderResult,
} from "@/server/features/purchasing-station/application/create-buy-order-use-case";
import {
  executeListBuyOrdersUseCase as executeListBuyOrdersUseCaseImpl,
  type ListBuyOrdersResult,
} from "@/server/features/purchasing-station/application/list-buy-orders-use-case";
import {
  executeFulfillBuyOrderUseCase as executeFulfillBuyOrderUseCaseImpl,
  type FulfillBuyOrderResult,
} from "@/server/features/purchasing-station/application/fulfill-buy-order-use-case";
import {
  executeCancelBuyOrderUseCase as executeCancelBuyOrderUseCaseImpl,
  type CancelBuyOrderResult,
} from "@/server/features/purchasing-station/application/cancel-buy-order-use-case";
import {
  executeGetPurchasingStationTransactionHistoryUseCase as executeGetPurchasingStationTransactionHistoryUseCaseImpl,
  type GetPurchasingStationTransactionHistoryResult,
} from "@/server/features/purchasing-station/application/get-purchasing-station-transaction-history-use-case";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { inventoryRepository } from "@/server/features/inventory/infrastructure";
import { userRepository } from "@/server/features/person/infrastructure";
import { financeService } from "@/server/features/finance";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { buyOrderRepository, purchasingStationTransactionQueryRepository } from "@/server/features/purchasing-station/infrastructure";
import { transact } from "@/server/lib/db";

/** 创建收购订单的参数校验 schema */
export const createBuyOrderSchema = z.object({
  buyerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  itemKey: z.string().trim().min(1, "物品标识不能为空"),
  quantity: z.number().int().positive("收购数量必须大于 0"),
  unitPrice: z.number().positive("单价必须大于 0"),
});

/** 查询收购订单列表的参数校验 schema */
export const listBuyOrdersSchema = z.object({
  buildingId: z.number().int().positive(),
});

/** 履行收购订单（出售物品）的参数校验 schema */
export const fulfillBuyOrderSchema = z.object({
  sellerUserId: z.string().uuid("用户 ID 不合法"),
  orderId: z.number().int().positive(),
  quantity: z.number().int().positive("出售数量必须为正整数"),
});

/** 取消收购订单的参数校验 schema */
export const cancelBuyOrderSchema = z.object({
  buyerUserId: z.string().uuid("用户 ID 不合法"),
  orderId: z.number().int().positive(),
});

/** 查询收购站交易历史的参数校验 schema */
export const getPurchasingStationTransactionHistorySchema = z.object({
  buildingId: z.number().int().positive(),
});

/** 创建收购订单入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executeCreateBuyOrderUseCase(input: unknown): Promise<CreateBuyOrderResult> {
  const parsed = createBuyOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeCreateBuyOrderUseCaseImpl({ ...parsed.data, itemKey: parsed.data.itemKey as ItemKey }, {
    buildingRepository,
    buyOrderRepository,
    userRepository,
    financeService,
    plotRepository,
    transact,
  });
}

/** 查询收购订单列表入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executeListBuyOrdersUseCase(input: unknown): Promise<ListBuyOrdersResult> {
  const parsed = listBuyOrdersSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeListBuyOrdersUseCaseImpl(parsed.data, {
    buildingRepository,
    buyOrderRepository,
  });
}

/** 履行收购订单入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executeFulfillBuyOrderUseCase(input: unknown): Promise<FulfillBuyOrderResult> {
  const parsed = fulfillBuyOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeFulfillBuyOrderUseCaseImpl(parsed.data, {
    buyOrderRepository,
    inventoryRepository,
    userRepository,
    financeService,
    transact,
  });
}

/** 取消收购订单入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executeCancelBuyOrderUseCase(input: unknown): Promise<CancelBuyOrderResult> {
  const parsed = cancelBuyOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeCancelBuyOrderUseCaseImpl(parsed.data, {
    buyOrderRepository,
    userRepository,
    financeService,
    transact,
  });
}

/** 查询收购站交易历史入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executeGetPurchasingStationTransactionHistoryUseCase(
  input: unknown,
): Promise<GetPurchasingStationTransactionHistoryResult> {
  const parsed = getPurchasingStationTransactionHistorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeGetPurchasingStationTransactionHistoryUseCaseImpl(parsed.data, {
    buildingRepository,
    purchasingStationTransactionQueryRepository,
  });
}
