/**
 * API 访问令牌路由器
 *
 * 提供生成 API 访问令牌的接口，允许用户通过令牌进行 API 认证，
 * 作为 NextAuth Session 之外的另一种鉴权方式。
 */

import { createTRPCRouter, publicProcedure } from "@/server/lib/trpc/core";
import {
  executeGenerateApiAccessTokenUseCase,
  generateApiAccessTokenSchema,
} from "@/server/features/api-access-token/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const apiAccessTokenRouter = createTRPCRouter({
  /** 生成 API 访问令牌（公开接口，需提供用户凭据） */
  generate: publicProcedure
    .input(generateApiAccessTokenSchema)
    .mutation(async ({ input }) => {
      const { token } = unwrapUseCaseResult(
        await executeGenerateApiAccessTokenUseCase(input),
      );
      return { token };
    }),
});
