/**
 * 商店路由器
 *
 * 提供商店相关接口：创建商品上架、查询上架列表、
 * 购买商品、取消上架以及查询交易历史。
 */

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeCreateShopListingUseCase,
  executeListShopListingsUseCase,
  executePurchaseShopListingUseCase,
  executeCancelShopListingUseCase,
  executeGetShopTransactionHistoryUseCase,
  createShopListingSchema,
  listShopListingsSchema,
  purchaseShopListingSchema,
  cancelShopListingSchema,
  getShopTransactionHistorySchema,
} from "@/server/features/shop/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const shopRouter = createTRPCRouter({
  /** 创建商品上架（卖家挂单出售物品） */
  createListing: protectedProcedure
    .input(createShopListingSchema.omit({ sellerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeCreateShopListingUseCase({
          sellerUserId: ctx.userId,
          buildingId: input.buildingId,
          itemKey: input.itemKey,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
        }),
      );
    }),
  /** 查询指定商店的所有上架商品（公开接口） */
  listings: publicProcedure
    .input(listShopListingsSchema)
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeListShopListingsUseCase({ buildingId: input.buildingId }),
      );
    }),
  /** 购买商品（买家从上架列表中购买指定数量） */
  purchase: protectedProcedure
    .input(purchaseShopListingSchema.omit({ buyerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executePurchaseShopListingUseCase({
          buyerUserId: ctx.userId,
          listingId: input.listingId,
          quantity: input.quantity,
        }),
      );
    }),
  /** 取消商品上架（仅上架者本人可操作） */
  cancelListing: protectedProcedure
    .input(cancelShopListingSchema.omit({ sellerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeCancelShopListingUseCase({
          sellerUserId: ctx.userId,
          listingId: input.listingId,
        }),
      );
    }),
  /** 查询商店的交易历史记录（公开接口） */
  transactionHistory: publicProcedure
    .input(getShopTransactionHistorySchema)
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeGetShopTransactionHistoryUseCase({
          buildingId: input.buildingId,
        }),
      );
    }),
});
