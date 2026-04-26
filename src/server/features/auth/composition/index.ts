/**
 * 认证模块组合根（Composition Root）
 *
 * 负责将认证相关用例与具体的基础设施实现进行组装：
 * - 定义输入校验 Schema（Zod）
 * - 注入仓储、服务等依赖后，对外暴露可直接调用的用例函数
 * 上层（如 tRPC 路由、NextAuth）直接调用此处导出的函数即可。
 */

import { z } from "zod";
import {
  executeLoginUserUseCase as executeLoginUserUseCaseImpl,
  type LoginUserResult,
} from "@/server/features/auth/application/login-user-use-case";
import {
  executeRegisterUserUseCase as executeRegisterUserUseCaseImpl,
  type RegisterUserResult,
} from "@/server/features/auth/application/register-user-use-case";
import { passwordHasher } from "@/server/features/auth/infrastructure";
import { userRepository, systemAccountService } from "@/server/features/person/infrastructure";
import { financeService } from "@/server/features/finance";
import { transact } from "@/server/lib/db";

/** 登录输入校验 Schema */
export const loginUserSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(6).max(128),
});

/** 注册输入校验 Schema */
export const registerUserSchema = z.object({
  username: z.string().trim().min(3, "用户名至少 3 位").max(32, "用户名最多 32 位"),
  password: z.string().min(6, "密码至少 6 位").max(128, "密码最多 128 位"),
});

/**
 * 执行登录用例（已注入依赖）
 * @param input 原始输入，内部会先做 Zod 校验
 */
export async function executeLoginUserUseCase(input: unknown): Promise<LoginUserResult> {
  const parsed = loginUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "参数校验失败" };
  }

  return executeLoginUserUseCaseImpl(parsed.data, {
    userRepository,
    passwordHasher,
  });
}

/**
 * 执行注册用例（已注入依赖）
 * @param input 原始输入，内部会先做 Zod 校验
 */
export async function executeRegisterUserUseCase(input: unknown): Promise<RegisterUserResult> {
  const parsed = registerUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" };
  }

  return executeRegisterUserUseCaseImpl(parsed.data, {
    userRepository,
    financeService,
    systemAccountService,
    passwordHasher,
    transact,
  });
}
