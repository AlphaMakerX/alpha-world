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
  listings: publicProcedure
    .input(listShopListingsSchema)
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeListShopListingsUseCase({ buildingId: input.buildingId }),
      );
    }),
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
