/**
 * 住宅路由器
 *
 * 提供住宅相关接口：发起休息、收取休息、查询休息任务、设定休息价格。
 */
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/lib/trpc/core";
import {
  executeStartRestUseCase,
  executeCollectRestUseCase,
  executeListRestJobsUseCase,
  executeSetRestPriceUseCase,
  startRestSchema,
  collectRestSchema,
  listRestJobsSchema,
  setRestPriceSchema,
} from "@/server/features/residential";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const residentialRouter = createTRPCRouter({
  /** 发起休息 */
  startRest: protectedProcedure
    .input(startRestSchema.omit({ userId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeStartRestUseCase({
          userId: ctx.userId,
          buildingId: input.buildingId,
        }),
      );
    }),
  /** 收取休息 */
  collectRest: protectedProcedure
    .input(collectRestSchema.omit({ userId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeCollectRestUseCase({
          userId: ctx.userId,
          jobId: input.jobId,
        }),
      );
    }),
  /** 查询休息任务列表 */
  restJobs: protectedProcedure
    .input(listRestJobsSchema)
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeListRestJobsUseCase({
          buildingId: input.buildingId,
        }),
      );
    }),
  /** 设定住宅休息价格 */
  setRestPrice: protectedProcedure
    .input(setRestPriceSchema.omit({ userId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeSetRestPriceUseCase({
          userId: ctx.userId,
          buildingId: input.buildingId,
          price: input.price,
        }),
      );
    }),
});
