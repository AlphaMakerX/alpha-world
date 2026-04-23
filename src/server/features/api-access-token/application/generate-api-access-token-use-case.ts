/**
 * 生成 API 访问令牌用例
 *
 * 验证用户凭证后生成一个新的 API 访问令牌。令牌以哈希形式存储在数据库中，
 * 明文仅在生成时返回一次。每个用户同一时间只保留一个有效令牌。
 */

import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import type { ApiAccessTokenRepository } from "@/server/features/api-access-token/domain/repositories/api-access-token-repository";
import type { TokenGenerator } from "@/server/features/api-access-token/domain/services/token-generator";
import type { TokenHasher } from "@/server/features/api-access-token/domain/services/token-hasher";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { Username } from "@/server/features/person/domain/value-objects/username";

/** 生成令牌的请求命令 */
export type GenerateApiAccessTokenCommand = {
  username: string;
  password: string;
};

/** 生成令牌成功结果 */
type GenerateApiAccessTokenSuccessResult = {
  ok: true;
  token: string;
};

/** 生成令牌失败结果 */
type GenerateApiAccessTokenFailureResult = {
  ok: false;
  error: string;
};

/** 生成令牌结果的联合类型 */
export type GenerateApiAccessTokenResult =
  | GenerateApiAccessTokenSuccessResult
  | GenerateApiAccessTokenFailureResult;

/** 用例所需的外部依赖 */
export type GenerateApiAccessTokenUseCaseDeps = {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  tokenGenerator: TokenGenerator;
  tokenHasher: TokenHasher;
  apiAccessTokenRepository: ApiAccessTokenRepository;
};

// 与 executeLoginUserUseCase 完全一致的失败响应，避免账户存在性泄漏
const INVALID_CREDENTIALS_RESULT: GenerateApiAccessTokenFailureResult = {
  ok: false,
  error: "用户名或密码错误",
};

/**
 * 执行生成 API 访问令牌用例
 *
 * 流程：验证用户名 -> 校验密码 -> 生成令牌 -> 哈希后存储 -> 返回明文令牌
 */
export async function executeGenerateApiAccessTokenUseCase(
  command: GenerateApiAccessTokenCommand,
  deps: GenerateApiAccessTokenUseCaseDeps,
): Promise<GenerateApiAccessTokenResult> {
  const username = Username.create(command.username);
  const user = await deps.userRepository.findByUsername(username);
  if (!user) {
    // 用户不存在时返回通用错误，防止用户名枚举攻击
    return INVALID_CREDENTIALS_RESULT;
  }

  const matched = await deps.passwordHasher.verify(command.password, user.passwordHash);
  if (!matched) {
    return INVALID_CREDENTIALS_RESULT;
  }

  // 生成令牌明文，计算哈希后存储（仅保存哈希值，明文不落库）
  const plainToken = deps.tokenGenerator.generate();
  const tokenHash = deps.tokenHasher.hash(plainToken);
  await deps.apiAccessTokenRepository.upsertForUser({
    userId: user.id,
    tokenHash,
  });

  // 明文令牌仅此处返回一次，后续无法再获取
  return { ok: true, token: plainToken };
}
