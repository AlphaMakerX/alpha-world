/**
 * API 访问令牌仓储的 Drizzle ORM 实现
 *
 * 基于 PostgreSQL 和 Drizzle ORM 实现令牌的持久化操作，
 * 使用 upsert 策略保证每个用户只保留一个有效令牌。
 */

import { eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import type { ApiAccessTokenRepository } from "@/server/features/api-access-token/domain/repositories/api-access-token-repository";
import { userApiTokens } from "@/server/features/api-access-token/infrastructure/schema";

/** 基于 Drizzle ORM 的 API 访问令牌仓储实现 */
export class DrizzleApiAccessTokenRepository implements ApiAccessTokenRepository {
  /** 为用户创建或更新令牌哈希（userId 冲突时更新已有记录） */
  async upsertForUser(input: { userId: string; tokenHash: string }): Promise<void> {
    const now = new Date();
    await getDbClient()
      .insert(userApiTokens)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userApiTokens.userId,
        set: {
          tokenHash: input.tokenHash,
          updatedAt: now,
        },
      });
  }

  /** 根据令牌哈希查找用户 ID */
  async findUserIdByHash(tokenHash: string): Promise<string | null> {
    const record = await getDbClient().query.userApiTokens.findFirst({
      where: eq(userApiTokens.tokenHash, tokenHash),
    });

    return record?.userId ?? null;
  }
}

/** 仓储单例实例 */
export const apiAccessTokenRepository: ApiAccessTokenRepository =
  new DrizzleApiAccessTokenRepository();
