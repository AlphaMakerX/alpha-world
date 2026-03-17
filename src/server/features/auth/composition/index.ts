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
import { transactionLedgerRepository, userRepository, systemAccountService } from "@/server/features/person/infrastructure";

export const loginUserSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(6).max(128),
});

export const registerUserSchema = z.object({
  username: z.string().trim().min(3, "用户名至少 3 位").max(32, "用户名最多 32 位"),
  password: z.string().min(6, "密码至少 6 位").max(128, "密码最多 128 位"),
});

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

export async function executeRegisterUserUseCase(input: unknown): Promise<RegisterUserResult> {
  const parsed = registerUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "参数校验失败", status: 400 };
  }

  return executeRegisterUserUseCaseImpl(parsed.data, {
    userRepository,
    transactionLedgerRepository,
    systemAccountService,
    passwordHasher,
  });
}
