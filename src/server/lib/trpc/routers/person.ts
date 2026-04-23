/**
 * 人物/用户路由器
 *
 * 提供用户信息查询、位置更新、财富排行榜以及角色资料查看等接口。
 */

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeGetCurrentUserUseCase,
  executeGetWealthLeaderboardUseCase,
  executeGetAdamProfileUseCase,
  executeGetPersonaProfileUseCase,
  executeUpdateUserPositionUseCase,
  getPersonaProfileSchema,
  updateUserPositionSchema,
} from "@/server/features/person/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const personRouter = createTRPCRouter({
  /** 获取当前登录用户的信息 */
  me: protectedProcedure.query(async ({ ctx }) => {
    return unwrapUseCaseResult(
      await executeGetCurrentUserUseCase({ userId: ctx.userId }),
    );
  }),
  /** 更新当前用户在地图上的位置坐标 */
  updatePosition: protectedProcedure
    .input(updateUserPositionSchema.omit({ userId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeUpdateUserPositionUseCase({
          userId: ctx.userId,
          position: input.position,
        }),
      );
    }),
  /** 获取财富排行榜（公开接口） */
  wealthLeaderboard: publicProcedure.query(() =>
    executeGetWealthLeaderboardUseCase(),
  ),
  /** 获取 Adam（系统预设角色）的资料 */
  adamProfile: publicProcedure.query(() => executeGetAdamProfileUseCase()),
  /** 根据 persona ID 获取指定角色的公开资料 */
  personaProfile: publicProcedure
    .input(getPersonaProfileSchema)
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeGetPersonaProfileUseCase(input),
      );
    }),
});
