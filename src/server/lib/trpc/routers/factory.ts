/**
 * 工厂路由器
 *
 * 提供工厂相关接口：查询配方列表、查询生产订单、发起生产、解锁配方、升级工厂。
 */

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeListFactoryRecipesUseCase,
  executeListFactoryOrdersUseCase,
  executeStartFactoryProductionUseCase,
  executeUnlockRecipeUseCase,
  executeUpgradeFactoryUseCase,
  listFactoryOrdersSchema,
  startFactoryProductionSchema,
  unlockRecipeSchema,
  upgradeFactorySchema,
  listFactoryRecipesSchema,
} from "@/server/features/factory/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const factoryRouter = createTRPCRouter({
  /** 获取工厂配方列表，支持可选 buildingId 按工厂筛选 */
  recipes: protectedProcedure
    .input(listFactoryRecipesSchema.optional())
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeListFactoryRecipesUseCase({
          buildingId: input?.buildingId,
        }),
      );
    }),
  /** 查询指定建筑的生产订单列表 */
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
  /** 发起工厂生产 */
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
  /** 解锁工厂配方 */
  unlockRecipe: protectedProcedure
    .input(unlockRecipeSchema.omit({ ownerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeUnlockRecipeUseCase({
          ownerUserId: ctx.userId,
          buildingId: input.buildingId,
          recipeId: input.recipeId,
        }),
      );
    }),
  /** 升级工厂等级 */
  upgradeFactory: protectedProcedure
    .input(upgradeFactorySchema.omit({ ownerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeUpgradeFactoryUseCase({
          ownerUserId: ctx.userId,
          buildingId: input.buildingId,
        }),
      );
    }),
});
