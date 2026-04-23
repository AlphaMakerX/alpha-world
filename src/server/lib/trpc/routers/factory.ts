/**
 * 工厂路由器
 *
 * 提供工厂相关接口：查询配方列表、查询生产订单、发起生产。
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
  listFactoryOrdersSchema,
  startFactoryProductionSchema,
} from "@/server/features/factory/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const factoryRouter = createTRPCRouter({
  /** 获取所有工厂配方（公开接口） */
  recipes: publicProcedure.query(() => executeListFactoryRecipesUseCase()),
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
  /** 发起工厂生产，根据配方和数量消耗材料并开始生产 */
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
