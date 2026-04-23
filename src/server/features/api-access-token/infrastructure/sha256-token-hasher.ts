/**
 * 基于 SHA-256 的令牌哈希器实现
 *
 * 使用 Node.js crypto 模块对令牌明文进行 SHA-256 哈希，输出 64 字符 hex 字符串。
 * SHA-256 适用于 API 令牌场景：令牌本身具备高熵，无需加盐。
 */

import { createHash } from "node:crypto";
import type { TokenHasher } from "@/server/features/api-access-token/domain/services/token-hasher";

/** SHA-256 令牌哈希器 */
export class Sha256TokenHasher implements TokenHasher {
  /** 将明文哈希为 64 字符的十六进制字符串 */
  hash(plainText: string): string {
    return createHash("sha256").update(plainText).digest("hex");
  }
}

/** 哈希器单例实例 */
export const tokenHasher: TokenHasher = new Sha256TokenHasher();
