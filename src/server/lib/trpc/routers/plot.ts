import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeListPlotsUseCase,
  executePurchasePlotUseCase,
} from "@/server/features/plot/application";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";
import { z } from "zod";

export const plotRouter = createTRPCRouter({
  list: publicProcedure.query(() => executeListPlotsUseCase()),
  purchase: protectedProcedure
    .input(z.object({ plotId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executePurchasePlotUseCase({
          plotId: input.plotId,
          buyerUserId: ctx.userId,
        }),
      );
    }),
});
