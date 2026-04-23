/**
 * 令牌生成器接口
 *
 * 定义了生成随机 API 访问令牌的契约，实现方需保证令牌的唯一性和安全性。
 */

/** 令牌生成器接口 */
export interface TokenGenerator {
  /** 生成一个新的随机令牌明文 */
  generate(): string;
}
