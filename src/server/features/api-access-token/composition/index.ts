import { z } from "zod";
import {
  executeGenerateApiAccessTokenUseCase as executeGenerateApiAccessTokenUseCaseImpl,
  type GenerateApiAccessTokenResult,
} from "@/server/features/api-access-token/application/generate-api-access-token-use-case";
import {
  apiAccessTokenRepository,
  tokenGenerator,
  tokenHasher,
} from "@/server/features/api-access-token/infrastructure";
import { passwordHasher } from "@/server/features/auth/infrastructure";
import { userRepository } from "@/server/features/person/infrastructure";
import { createResolveUserIdFromBearer } from "./resolve-user-id-from-bearer";

export const resolveUserIdFromBearer = createResolveUserIdFromBearer({
  apiAccessTokenRepository,
  tokenHasher,
});

export const generateApiAccessTokenSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(6).max(128),
});

export async function executeGenerateApiAccessTokenUseCase(
  input: unknown,
): Promise<GenerateApiAccessTokenResult> {
  const parsed = generateApiAccessTokenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "参数校验失败" };
  }

  return executeGenerateApiAccessTokenUseCaseImpl(parsed.data, {
    userRepository,
    passwordHasher,
    tokenGenerator,
    tokenHasher,
    apiAccessTokenRepository,
  });
}
