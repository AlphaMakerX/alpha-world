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
} from "@/server/features/shop/application";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";
import { z } from "zod";

export const shopRouter = createTRPCRouter({
  createListing: protectedProcedure
    .input(
      z.object({
        buildingId: z.number().int().positive(),
        itemKey: z.string().trim().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
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
    .input(z.object({ buildingId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeListShopListingsUseCase({ buildingId: input.buildingId }),
      );
    }),
  purchase: protectedProcedure
    .input(
      z.object({
        listingId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
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
    .input(z.object({ listingId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeCancelShopListingUseCase({
          sellerUserId: ctx.userId,
          listingId: input.listingId,
        }),
      );
    }),
  transactionHistory: publicProcedure
    .input(z.object({ buildingId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeGetShopTransactionHistoryUseCase({
          buildingId: input.buildingId,
        }),
      );
    }),
});
