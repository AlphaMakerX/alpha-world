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
  buyOrders: publicProcedure
    .input(listBuyOrdersSchema)
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeListBuyOrdersUseCase({ buildingId: input.buildingId }),
      );
    }),
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
