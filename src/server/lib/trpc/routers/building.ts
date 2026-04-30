/**
 * 建筑路由器
 *
 * 提供建筑建造和查询当前用户建筑列表的接口。
 * 所有接口均需要用户登录（protectedProcedure）。
 */

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/lib/trpc/core";
import {
  executeBuildBuildingUseCase,
  executeListMyBuildingsUseCase,
  buildBuildingBaseSchema,
  factorySubtypeRefinement,
} from "@/server/features/building/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const buildingRouter = createTRPCRouter({
  /** 在指定地块上建造建筑（ownerUserId 从上下文自动注入） */
  build: protectedProcedure
    .input(buildBuildingBaseSchema.omit({ ownerUserId: true }).refine(factorySubtypeRefinement, { message: "无效的工厂子类型" }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeBuildBuildingUseCase({
          ownerUserId: ctx.userId,
          plotId: input.plotId,
          buildingType: input.buildingType,
          factorySubtype: input.factorySubtype,
        }),
      );
    }),
  /** 查询当前用户拥有的所有建筑 */
  myBuildings: protectedProcedure.query(async ({ ctx }) => {
    return unwrapUseCaseResult(
      await executeListMyBuildingsUseCase({ ownerUserId: ctx.userId }),
    );
  }),
});
