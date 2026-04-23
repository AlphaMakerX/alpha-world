/**
 * 地块路由器
 *
 * 提供地块列表查询和地块购买接口。
 */

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
  /** 获取所有地块列表（公开接口） */
  list: publicProcedure.query(() => executeListPlotsUseCase()),
  /** 购买指定地块（buyerUserId 从上下文自动注入） */
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
