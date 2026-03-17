import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeListFactoryRecipesUseCase,
  executeListFactoryOrdersUseCase,
  executeStartFactoryProductionUseCase,
  listFactoryOrdersSchema,
  startFactoryProductionSchema,
} from "@/server/features/factory/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const factoryRouter = createTRPCRouter({
  recipes: publicProcedure.query(() => executeListFactoryRecipesUseCase()),
  orders: protectedProcedure
    .input(listFactoryOrdersSchema.omit({ ownerUserId: true }))
    .query(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeListFactoryOrdersUseCase({
          ownerUserId: ctx.userId,
          buildingId: input.buildingId,
        }),
      );
    }),
  startProduction: protectedProcedure
    .input(startFactoryProductionSchema.omit({ ownerUserId: true }))
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
