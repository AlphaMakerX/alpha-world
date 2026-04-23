/**
 * 从 Authorization Bearer 头解析用户 ID
 *
 * 解析 HTTP Authorization 头中的 Bearer 令牌，对令牌哈希后查找对应用户。
 * 采用工厂函数模式，支持依赖注入。
 */

import type { ApiAccessTokenRepository } from "@/server/features/api-access-token/domain/repositories/api-access-token-repository";
import type { TokenHasher } from "@/server/features/api-access-token/domain/services/token-hasher";

// 防止异常长度进入 hash；正常 awt_ + base64url(32) ≈ 47 字符，256 远超合法上限
const MAX_TOKEN_LENGTH = 256;
// scheme 大小写不敏感；允许 Bearer 与 token 之间多个空白
const BEARER_SCHEME = /^Bearer\s+(.+)$/i;

/** 工厂函数所需的依赖 */
export type ResolveUserIdFromBearerDeps = {
  apiAccessTokenRepository: ApiAccessTokenRepository;
  tokenHasher: TokenHasher;
};

/** 解析 Bearer 头并返回用户 ID 的函数签名 */
export type ResolveUserIdFromBearer = (
  authorizationHeader: string | null,
) => Promise<string | null>;

/**
 * 创建 Bearer 令牌解析函数（工厂模式）
 *
 * 返回一个闭包函数，该函数从 Authorization 头中提取令牌、
 * 计算哈希后在仓储中查找对应用户 ID。
 */
export function createResolveUserIdFromBearer(
  deps: ResolveUserIdFromBearerDeps,
): ResolveUserIdFromBearer {
  return async function resolveUserIdFromBearer(authorizationHeader) {
    if (!authorizationHeader) return null;
    const trimmedHeader = authorizationHeader.trim();
    if (!trimmedHeader) return null;

    // 用正则提取 Bearer scheme 后的令牌部分
    const match = BEARER_SCHEME.exec(trimmedHeader);
    if (!match) return null;
    const token = match[1].trim();
    if (!token) return null;
    // 超长令牌直接拒绝，避免无效哈希计算
    if (token.length > MAX_TOKEN_LENGTH) return null;

    // 对令牌明文哈希后查库
    const hash = deps.tokenHasher.hash(token);
    return deps.apiAccessTokenRepository.findUserIdByHash(hash);
  };
}
