/**
 * 收购站路由器
 *
 * 提供收购站相关接口：创建求购订单、查询订单列表、
 * 履行订单（卖家向买家出售）、取消订单以及查询交易历史。
 */

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeCreateBuyOrderUseCase,
  executeListBuyOrdersUseCase,
  executeFulfillBuyOrderUseCase,
  executeCancelBuyOrderUseCase,
  executeGetPurchasingStationTransactionHistoryUseCase,
  createBuyOrderSchema,
  listBuyOrdersSchema,
  fulfillBuyOrderSchema,
  cancelBuyOrderSchema,
  getPurchasingStationTransactionHistorySchema,
} from "@/server/features/purchasing-station/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const purchasingStationRouter = createTRPCRouter({
  /** 创建求购订单（指定物品、数量和单价） */
  createBuyOrder: protectedProcedure
    .input(createBuyOrderSchema.omit({ buyerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeCreateBuyOrderUseCase({
          buyerUserId: ctx.userId,
          buildingId: input.buildingId,
          itemKey: input.itemKey,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
        }),
      );
    }),
  /** 查询指定收购站的所有求购订单（公开接口） */
  buyOrders: publicProcedure
    .input(listBuyOrdersSchema)
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeListBuyOrdersUseCase({ buildingId: input.buildingId }),
      );
    }),
  /** 履行求购订单（卖家将物品出售给买家） */
  fulfillBuyOrder: protectedProcedure
    .input(fulfillBuyOrderSchema.omit({ sellerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeFulfillBuyOrderUseCase({
          sellerUserId: ctx.userId,
          orderId: input.orderId,
          quantity: input.quantity,
        }),
      );
    }),
  /** 取消求购订单（仅订单创建者可操作） */
  cancelBuyOrder: protectedProcedure
    .input(cancelBuyOrderSchema.omit({ buyerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeCancelBuyOrderUseCase({
          buyerUserId: ctx.userId,
          orderId: input.orderId,
        }),
      );
    }),
  /** 查询收购站的交易历史记录（公开接口） */
  transactionHistory: publicProcedure
    .input(getPurchasingStationTransactionHistorySchema)
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeGetPurchasingStationTransactionHistoryUseCase({
          buildingId: input.buildingId,
        }),
      );
    }),
});
