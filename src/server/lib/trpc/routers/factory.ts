import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeListFactoryRecipesUseCase,
  executeListFactoryOrdersUseCase,
  executeStartFactoryProductionUseCase,
} from "@/server/features/factory/application";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";
import { z } from "zod";

export const factoryRouter = createTRPCRouter({
  recipes: publicProcedure.query(() => executeListFactoryRecipesUseCase()),
  orders: protectedProcedure
    .input(z.object({ buildingId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeListFactoryOrdersUseCase({
          ownerUserId: ctx.userId,
          buildingId: input.buildingId,
        }),
      );
    }),
  startProduction: protectedProcedure
    .input(
      z.object({
        buildingId: z.number().int().positive(),
        recipeId: z.string().trim().min(1),
        quantity: z.number().int().min(1).max(99).default(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeStartFactoryProductionUseCase({
          ownerUserId: ctx.userId,
          buildingId: input.buildingId,
          recipeId: input.recipeId,
          quantity: input.quantity,
        }),
      );
    }),
});
