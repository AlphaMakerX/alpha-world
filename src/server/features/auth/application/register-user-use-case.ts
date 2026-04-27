/**
 * 用户注册用例
 *
 * 处理新用户注册的核心业务逻辑：
 * 1. 校验用户名是否为系统保留名称
 * 2. 校验用户名唯一性
 * 3. 创建新用户并发放初始资金（由系统账户转出）
 * 4. 上述操作在同一事务中完成，保证数据一致性
 */

import { randomUUID } from "crypto";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { User } from "@/server/features/person/domain/entities/user";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { FinanceService } from "@/server/features/finance/application/services/finance-service";
import { Username } from "@/server/features/person/domain/value-objects/username";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 注册命令：包含用户提交的用户名和密码 */
export type RegisterUserCommand = {
  username: string;
  password: string;
};

/** 注册成功结果 */
type RegisterUserSuccessResult = {
  ok: true;
  user: {
    id: string;
    username: string;
  };
};

/** 注册失败结果，附带错误码供上层映射 */
type RegisterUserFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 注册用例返回的联合类型 */
export type RegisterUserResult = RegisterUserSuccessResult | RegisterUserFailureResult;

/** 注册用例所需的外部依赖 */
export type RegisterUserUseCaseDeps = {
  userRepository: UserRepository;
  financeService: FinanceService;
  systemAccountService: SystemAccountService;
  passwordHasher: PasswordHasher;
  /** 事务执行器，确保多步数据库操作的原子性 */
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 校验通过后传递给业务逻辑的上下文 */
type ValidatedContext = {
  username: Username;
  adam: User;
};

/**
 * 校验注册命令的合法性
 * @param command 注册命令
 * @param deps   外部依赖
 * @returns 校验通过返回 ValidatedContext，失败返回 RegisterUserFailureResult
 */
async function validate(
  command: RegisterUserCommand,
  deps: RegisterUserUseCaseDeps,
): Promise<ValidatedContext | RegisterUserFailureResult> {
  // 检查是否使用了系统保留用户名（如 Adam）
  if (command.username.trim().toLowerCase() === ADAM_PERSONA_CONFIG.username) {
    return {
      ok: false,
      error: "该用户名为系统保留名称",
      code: "CONFLICT",
    };
  }

  // 用户名唯一性校验
  const username = Username.create(command.username);
  const existingUser = await deps.userRepository.findByUsername(username);
  if (existingUser) {
    return {
      ok: false,
      error: "用户名已存在",
      code: "CONFLICT",
    };
  }

  // 获取系统账户（Adam），作为初始资金的来源
  const adam = await deps.systemAccountService.getSystemAccount();

  return { username, adam };
}

function isFailure(
  result: ValidatedContext | RegisterUserFailureResult,
): result is RegisterUserFailureResult {
  return "ok" in result;
}

/**
 * 执行用户注册用例
 * @param command 注册命令（用户名 + 密码）
 * @param deps   外部依赖
 * @returns 注册结果，成功时返回用户信息，失败时返回错误提示和错误码
 */
export async function executeRegisterUserUseCase(
  command: RegisterUserCommand,
  deps: RegisterUserUseCaseDeps,
): Promise<RegisterUserResult> {
  const validated = await validate(command, deps);
  if (isFailure(validated)) return validated;
  const { username, adam } = validated;

  // 新用户初始资金金额
  const initialMoney = 10000;
  const passwordHash = await deps.passwordHasher.hash(command.password);
  const user = User.register({
    id: randomUUID(),
    username: username.getValue(),
    passwordHash,
    initialMoney,
  });

  // 在事务中完成：保存用户 → 系统账户转账赠金
  await deps.transact(async () => {
    await deps.userRepository.save(user);
    await deps.financeService.transfer({
      payer: adam,
      receiver: user,
      amount: initialMoney,
      type: "registration_grant",
      description: `注册赠金 → ${user.username.getValue()}`,
    });
  });

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username.getValue(),
    },
  };
}
