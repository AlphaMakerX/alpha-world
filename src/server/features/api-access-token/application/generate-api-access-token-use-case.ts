import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import type { ApiAccessTokenRepository } from "@/server/features/api-access-token/domain/repositories/api-access-token-repository";
import type { TokenGenerator } from "@/server/features/api-access-token/domain/services/token-generator";
import type { TokenHasher } from "@/server/features/api-access-token/domain/services/token-hasher";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { Username } from "@/server/features/person/domain/value-objects/username";

export type GenerateApiAccessTokenCommand = {
  username: string;
  password: string;
};

type GenerateApiAccessTokenSuccessResult = {
  ok: true;
  token: string;
};

type GenerateApiAccessTokenFailureResult = {
  ok: false;
  error: string;
};

export type GenerateApiAccessTokenResult =
  | GenerateApiAccessTokenSuccessResult
  | GenerateApiAccessTokenFailureResult;

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

export async function executeGenerateApiAccessTokenUseCase(
  command: GenerateApiAccessTokenCommand,
  deps: GenerateApiAccessTokenUseCaseDeps,
): Promise<GenerateApiAccessTokenResult> {
  const username = Username.create(command.username);
  const user = await deps.userRepository.findByUsername(username);
  if (!user) {
    return INVALID_CREDENTIALS_RESULT;
  }

  const matched = await deps.passwordHasher.verify(command.password, user.passwordHash);
  if (!matched) {
    return INVALID_CREDENTIALS_RESULT;
  }

  const plainToken = deps.tokenGenerator.generate();
  const tokenHash = deps.tokenHasher.hash(plainToken);
  await deps.apiAccessTokenRepository.upsertForUser({
    userId: user.id,
    tokenHash,
  });

  return { ok: true, token: plainToken };
}
