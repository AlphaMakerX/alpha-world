/**
 * 认证路由器
 *
 * 提供用户注册接口，新用户通过该接口创建账号。
 */

import { createTRPCRouter, publicProcedure } from "@/server/lib/trpc/core";
import {
  executeRegisterUserUseCase,
  registerUserSchema,
} from "@/server/features/auth/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const authRouter = createTRPCRouter({
  /** 用户注册（公开接口） */
  register: publicProcedure
    .input(registerUserSchema)
    .mutation(async ({ input }) => {
      const { user } = unwrapUseCaseResult(
        await executeRegisterUserUseCase(input),
      );
      return { user };
    }),
});
