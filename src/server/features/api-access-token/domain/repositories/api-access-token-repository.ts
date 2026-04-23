/**
 * API 访问令牌仓储接口
 *
 * 定义了 API 访问令牌的持久化操作契约，包括令牌的创建/更新和按哈希值查找用户。
 */

/** API 访问令牌仓储接口 */
export interface ApiAccessTokenRepository {
  /** 为指定用户创建或更新令牌哈希（每个用户只保留一个有效令牌） */
  upsertForUser(input: { userId: string; tokenHash: string }): Promise<void>;

  /** 根据令牌哈希值查找对应的用户 ID，未找到时返回 null */
  findUserIdByHash(tokenHash: string): Promise<string | null>;
}
