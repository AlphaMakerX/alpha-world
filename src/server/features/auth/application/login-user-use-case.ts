/**
 * 用户登录用例
 *
 * 处理用户凭据登录的核心业务逻辑：验证用户名是否存在，校验密码是否匹配。
 * 采用依赖注入模式，通过 deps 参数接收所需的仓储和服务。
 */

import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { Username } from "@/server/features/person/domain/value-objects/username";

/** 登录命令：包含用户提交的用户名和密码 */
export type LoginUserCommand = {
  username: string;
  password: string;
};

/** 登录成功结果 */
type LoginUserSuccessResult = {
  ok: true;
  user: {
    id: string;
    username: string;
  };
};

/** 登录失败结果 */
type LoginUserFailureResult = {
  ok: false;
  error: string;
};

/** 登录用例返回的联合类型，成功或失败二选一 */
export type LoginUserResult = LoginUserSuccessResult | LoginUserFailureResult;

/** 登录用例所需的外部依赖 */
export type LoginUserUseCaseDeps = {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
};

/**
 * 执行用户登录用例
 * @param command 登录命令（用户名 + 密码）
 * @param deps   外部依赖（用户仓储、密码哈希服务）
 * @returns 登录结果，成功时返回用户信息，失败时返回错误提示
 */
export async function executeLoginUserUseCase(
  command: LoginUserCommand,
  deps: LoginUserUseCaseDeps,
): Promise<LoginUserResult> {
  // 将原始字符串转为 Username 值对象（内部会做格式校验）
  const username = Username.create(command.username);
  const user = await deps.userRepository.findByUsername(username);
  if (!user) {
    // 用户不存在时返回模糊提示，避免泄露用户名是否已注册
    return {
      ok: false,
      error: "用户名或密码错误",
    };
  }

  // 校验密码哈希
  const matched = await deps.passwordHasher.verify(command.password, user.passwordHash);
  if (!matched) {
    return {
      ok: false,
      error: "用户名或密码错误",
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username.getValue(),
    },
  };
}
