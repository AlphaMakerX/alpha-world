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
import { transactionLedgerRepository, userRepository } from "@/server/features/person/infrastructure";
import { shopListingRepository, shopTransactionQueryRepository } from "@/server/features/shop/infrastructure";
import { transact } from "@/server/lib/db";

export const createShopListingSchema = z.object({
  sellerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  itemKey: z.string().trim().min(1, "物品标识不能为空"),
  quantity: z.number().int().positive("上架数量必须大于 0"),
  unitPrice: z.number().nonnegative("单价不能小于 0"),
});

export const listShopListingsSchema = z.object({
  buildingId: z.number().int().positive(),
});

export const purchaseShopListingSchema = z.object({
  buyerUserId: z.string().uuid("用户 ID 不合法"),
  listingId: z.number().int().positive(),
  quantity: z.number().int().positive("购买数量必须为正整数"),
});

export const cancelShopListingSchema = z.object({
  sellerUserId: z.string().uuid("用户 ID 不合法"),
  listingId: z.number().int().positive(),
});

export const getShopTransactionHistorySchema = z.object({
  buildingId: z.number().int().positive(),
});

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
    transactionLedgerRepository,
    transact,
  });
}

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
