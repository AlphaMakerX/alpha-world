/**
 * 财务路由器
 *
 * 提供财务相关接口：用户间直接转账。
 */

import { createTRPCRouter, protectedProcedure } from "@/server/lib/trpc/core";
import {
  executeTransferMoneyUseCase,
  transferMoneySchema,
} from "@/server/features/finance/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const financeRouter = createTRPCRouter({
  /** 向指定用户转账金币 */
  transfer: protectedProcedure
    .input(transferMoneySchema.omit({ payerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeTransferMoneyUseCase({
          payerUserId: ctx.userId,
          toUsername: input.toUsername,
          amount: input.amount,
          description: input.description,
        }),
      );
    }),
});
