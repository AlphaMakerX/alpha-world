/**
 * 令牌哈希器接口
 *
 * 定义了对令牌明文进行单向哈希的契约，用于安全存储令牌（数据库中只保存哈希值）。
 */

/** 令牌哈希器接口 */
export interface TokenHasher {
  /** 将令牌明文转换为哈希值 */
  hash(plainText: string): string;
}
