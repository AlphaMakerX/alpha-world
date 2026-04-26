/**
 * 商店模块组合根（Composition Root）
 *
 * 负责将商店相关的所有用例与具体的基础设施实现进行组装，
 * 对外暴露带有参数校验（Zod schema）的用例入口函数。
 * 调用方只需传入原始输入，组合根负责校验、依赖注入和执行。
 */

import { z } from "zod";
import {
  executeCreateShopListingUseCase as executeCreateShopListingUseCaseImpl,
  type CreateShopListingResult,
} from "@/server/features/shop/application/create-shop-listing-use-case";
import {
  executeListShopListingsUseCase as executeListShopListingsUseCaseImpl,
  type ListShopListingsResult,
} from "@/server/features/shop/application/list-shop-listings-use-case";
import {
  executePurchaseShopListingUseCase as executePurchaseShopListingUseCaseImpl,
  type PurchaseShopListingResult,
} from "@/server/features/shop/application/purchase-shop-listing-use-case";
import {
  executeCancelShopListingUseCase as executeCancelShopListingUseCaseImpl,
  type CancelShopListingResult,
} from "@/server/features/shop/application/cancel-shop-listing-use-case";
import {
  executeGetShopTransactionHistoryUseCase as executeGetShopTransactionHistoryUseCaseImpl,
  type GetShopTransactionHistoryResult,
} from "@/server/features/shop/application/get-shop-transaction-history-use-case";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { inventoryRepository } from "@/server/features/inventory/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { userRepository } from "@/server/features/person/infrastructure";
import { financeService } from "@/server/features/finance";
import { shopListingRepository, shopTransactionQueryRepository } from "@/server/features/shop/infrastructure";
import { transact } from "@/server/lib/db";

/** 创建商店上架商品的参数校验 schema */
export const createShopListingSchema = z.object({
  sellerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  itemKey: z.string().trim().min(1, "物品标识不能为空"),
  quantity: z.number().int().positive("上架数量必须大于 0"),
  unitPrice: z.number().nonnegative("单价不能小于 0"),
});

/** 查询在售商品列表的参数校验 schema */
export const listShopListingsSchema = z.object({
  buildingId: z.number().int().positive(),
});

/** 购买商品的参数校验 schema */
export const purchaseShopListingSchema = z.object({
  buyerUserId: z.string().uuid("用户 ID 不合法"),
  listingId: z.number().int().positive(),
  quantity: z.number().int().positive("购买数量必须为正整数"),
});

/** 取消上架商品的参数校验 schema */
export const cancelShopListingSchema = z.object({
  sellerUserId: z.string().uuid("用户 ID 不合法"),
  listingId: z.number().int().positive(),
});

/** 查询交易历史的参数校验 schema */
export const getShopTransactionHistorySchema = z.object({
  buildingId: z.number().int().positive(),
});

/** 创建商店上架商品入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executeCreateShopListingUseCase(input: unknown): Promise<CreateShopListingResult> {
  const parsed = createShopListingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeCreateShopListingUseCaseImpl(parsed.data, {
    buildingRepository,
    shopListingRepository,
    inventoryRepository,
    plotRepository,
    transact,
  });
}

/** 查询在售商品列表入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executeListShopListingsUseCase(input: unknown): Promise<ListShopListingsResult> {
  const parsed = listShopListingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeListShopListingsUseCaseImpl(parsed.data, {
    buildingRepository,
    shopListingRepository,
  });
}

/** 购买商品入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executePurchaseShopListingUseCase(input: unknown): Promise<PurchaseShopListingResult> {
  const parsed = purchaseShopListingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executePurchaseShopListingUseCaseImpl(parsed.data, {
    shopListingRepository,
    inventoryRepository,
    userRepository,
    financeService,
    transact,
  });
}

/** 取消上架商品入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executeCancelShopListingUseCase(input: unknown): Promise<CancelShopListingResult> {
  const parsed = cancelShopListingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeCancelShopListingUseCaseImpl(parsed.data, {
    shopListingRepository,
    inventoryRepository,
    transact,
  });
}

/** 查询交易历史入口：校验参数 -> 注入依赖 -> 执行用例 */
export async function executeGetShopTransactionHistoryUseCase(input: unknown): Promise<GetShopTransactionHistoryResult> {
  const parsed = getShopTransactionHistorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeGetShopTransactionHistoryUseCaseImpl(parsed.data, {
    buildingRepository,
    shopTransactionQueryRepository,
  });
}
