import type { ApiAccessTokenRepository } from "@/server/features/api-access-token/domain/repositories/api-access-token-repository";
import type { TokenHasher } from "@/server/features/api-access-token/domain/services/token-hasher";

// 防止异常长度进入 hash；正常 awt_ + base64url(32) ≈ 47 字符，256 远超合法上限
const MAX_TOKEN_LENGTH = 256;
// scheme 大小写不敏感；允许 Bearer 与 token 之间多个空白
const BEARER_SCHEME = /^Bearer\s+(.+)$/i;

export type ResolveUserIdFromBearerDeps = {
  apiAccessTokenRepository: ApiAccessTokenRepository;
  tokenHasher: TokenHasher;
};

export type ResolveUserIdFromBearer = (
  authorizationHeader: string | null,
) => Promise<string | null>;

export function createResolveUserIdFromBearer(
  deps: ResolveUserIdFromBearerDeps,
): ResolveUserIdFromBearer {
  return async function resolveUserIdFromBearer(authorizationHeader) {
    if (!authorizationHeader) return null;
    const trimmedHeader = authorizationHeader.trim();
    if (!trimmedHeader) return null;

    const match = BEARER_SCHEME.exec(trimmedHeader);
    if (!match) return null;
    const token = match[1].trim();
    if (!token) return null;
    if (token.length > MAX_TOKEN_LENGTH) return null;

    const hash = deps.tokenHasher.hash(token);
    return deps.apiAccessTokenRepository.findUserIdByHash(hash);
  };
}
