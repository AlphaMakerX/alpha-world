/**
 * 基于 Node.js crypto 模块的令牌生成器实现
 *
 * 使用 crypto.randomBytes 生成安全随机令牌，格式为 "awt_" 前缀 + base64url 编码的随机字节。
 */

import { randomBytes } from "node:crypto";
import type { TokenGenerator } from "@/server/features/api-access-token/domain/services/token-generator";

/** 令牌前缀，便于识别令牌类型（api web token） */
const TOKEN_PREFIX = "awt_";
/** 随机部分的字节数，32 字节 = 256 位熵 */
const TOKEN_ENTROPY_BYTES = 32;

/** 基于 crypto.randomBytes 的令牌生成器 */
export class CryptoTokenGenerator implements TokenGenerator {
  /** 生成格式为 "awt_{base64url随机串}" 的令牌 */
  generate(): string {
    const body = randomBytes(TOKEN_ENTROPY_BYTES).toString("base64url");
    return `${TOKEN_PREFIX}${body}`;
  }
}

/** 生成器单例实例 */
export const tokenGenerator: TokenGenerator = new CryptoTokenGenerator();
