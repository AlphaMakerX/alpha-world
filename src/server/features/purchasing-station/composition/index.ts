import { z } from "zod";
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
import { transactionLedgerRepository, userRepository } from "@/server/features/person/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { buyOrderRepository, purchasingStationTransactionQueryRepository } from "@/server/features/purchasing-station/infrastructure";
import { transact } from "@/server/lib/db";

export const createBuyOrderSchema = z.object({
  buyerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  itemKey: z.string().trim().min(1, "物品标识不能为空"),
  quantity: z.number().int().positive("收购数量必须大于 0"),
  unitPrice: z.number().positive("单价必须大于 0"),
});

export const listBuyOrdersSchema = z.object({
  buildingId: z.number().int().positive(),
});

export const fulfillBuyOrderSchema = z.object({
  sellerUserId: z.string().uuid("用户 ID 不合法"),
  orderId: z.number().int().positive(),
  quantity: z.number().int().positive("出售数量必须为正整数"),
});

export const cancelBuyOrderSchema = z.object({
  buyerUserId: z.string().uuid("用户 ID 不合法"),
  orderId: z.number().int().positive(),
});

export const getPurchasingStationTransactionHistorySchema = z.object({
  buildingId: z.number().int().positive(),
});

export async function executeCreateBuyOrderUseCase(input: unknown): Promise<CreateBuyOrderResult> {
  const parsed = createBuyOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeCreateBuyOrderUseCaseImpl(parsed.data, {
    buildingRepository,
    buyOrderRepository,
    userRepository,
    plotRepository,
    transact,
  });
}

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
    transactionLedgerRepository,
    transact,
  });
}

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
    transact,
  });
}

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
