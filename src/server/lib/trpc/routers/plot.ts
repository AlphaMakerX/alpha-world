import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeListPlotsUseCase,
  executePurchasePlotUseCase,
  purchasePlotSchema,
} from "@/server/features/plot/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const plotRouter = createTRPCRouter({
  list: publicProcedure.query(() => executeListPlotsUseCase()),
  purchase: protectedProcedure
    .input(purchasePlotSchema.omit({ buyerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executePurchasePlotUseCase({
          plotId: input.plotId,
          buyerUserId: ctx.userId,
        }),
      );
    }),
});
