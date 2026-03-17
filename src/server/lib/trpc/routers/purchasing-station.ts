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
} from "@/server/features/purchasing-station/application";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";
import { z } from "zod";

export const purchasingStationRouter = createTRPCRouter({
  createBuyOrder: protectedProcedure
    .input(
      z.object({
        buildingId: z.number().int().positive(),
        itemKey: z.string().trim().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    )
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
  buyOrders: publicProcedure
    .input(z.object({ buildingId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeListBuyOrdersUseCase({ buildingId: input.buildingId }),
      );
    }),
  fulfillBuyOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeFulfillBuyOrderUseCase({
          sellerUserId: ctx.userId,
          orderId: input.orderId,
          quantity: input.quantity,
        }),
      );
    }),
  cancelBuyOrder: protectedProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeCancelBuyOrderUseCase({
          buyerUserId: ctx.userId,
          orderId: input.orderId,
        }),
      );
    }),
  transactionHistory: publicProcedure
    .input(z.object({ buildingId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeGetPurchasingStationTransactionHistoryUseCase({
          buildingId: input.buildingId,
        }),
      );
    }),
});
