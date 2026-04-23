/**
 * Adam 用户初始化步骤
 *
 * 创建系统管理员用户 Adam（系统中的第一个用户），包括设置初始密码和初始资金。
 * Adam 是整个系统经济体系的资金来源。
 */

import { User } from "@/server/features/person/domain/entities/user";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** Adam 步骤所需的外部依赖 */
type ExecuteAdamStepDeps = {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
};

type AdamStepFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type ExecuteAdamStepResult = { ok: true } | AdamStepFailureResult;

/**
 * 执行 Adam 用户初始化步骤
 *
 * 从环境配置读取 Adam 的初始密码，哈希后注册 Adam 用户并保存到数据库。
 */
export async function executeAdamStep(input: { deps: ExecuteAdamStepDeps }): Promise<ExecuteAdamStepResult> {
  // 检查环境变量中是否配置了 Adam 的初始密码
  if (!ADAM_PERSONA_CONFIG.initialPassword || ADAM_PERSONA_CONFIG.initialPassword.trim().length === 0) {
    return {
      ok: false,
      error: "ADAM_INITIAL_PASSWORD is not set. Please configure it in your environment.",
      code: "BAD_REQUEST",
    };
  }
  const adamPasswordHash = await input.deps.passwordHasher.hash(ADAM_PERSONA_CONFIG.initialPassword);

  // 使用预定义的 userId、用户名和初始资金注册 Adam
  const adam = User.register({
    id: ADAM_PERSONA_CONFIG.userId,
    username: ADAM_PERSONA_CONFIG.username,
    passwordHash: adamPasswordHash,
    initialMoney: ADAM_PERSONA_CONFIG.initialMoney,
  });

  await input.deps.userRepository.save(adam);
  return { ok: true };
}
