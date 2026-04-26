/**
 * 人员查询仓储的 Drizzle ORM 实现
 *
 * 提供财富排行榜查询和 Adam 账户概况查询的具体数据库实现。
 */
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/server/lib/db";
import type {
  AdamTransactionRecord,
  PersonQueryRepository,
  WealthLeaderboardItem,
} from "@/server/features/person/domain/repositories/person-query-repository";
import { users } from "@/server/features/person/infrastructure/schema";
import { moneyTransactions } from "@/server/features/finance/infrastructure/schema";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";

/** 基于 Drizzle ORM 的人员查询仓储实现 */
class DrizzlePersonQueryRepository implements PersonQueryRepository {
  /** 查询财富排行榜：按金额降序取前 limit 名 */
  async listWealthLeaderboard(limit: number): Promise<WealthLeaderboardItem[]> {
    const rows = await db
      .select({
        username: users.username,
        money: users.money,
      })
      .from(users)
      .orderBy(desc(users.money))
      .limit(limit);

    return rows.map((row) => ({
      username: row.username,
      money: Number(row.money),
    }));
  }

  /** 获取 Adam 账户概况：余额 + 最近 limit 条关联交易 */
  async getAdamProfile(limit: number): Promise<{
    money: number;
    transactions: AdamTransactionRecord[];
  }> {
    const adamRow = await db.query.users.findFirst({
      where: eq(users.id, ADAM_PERSONA_CONFIG.userId),
    });

    const rows = await db
      .select({
        id: moneyTransactions.id,
        fromUserId: moneyTransactions.fromUserId,
        toUserId: moneyTransactions.toUserId,
        amount: moneyTransactions.amount,
        type: moneyTransactions.type,
        description: moneyTransactions.description,
        createdAt: moneyTransactions.createdAt,
      })
      .from(moneyTransactions)
      .where(
        or(
          eq(moneyTransactions.fromUserId, ADAM_PERSONA_CONFIG.userId),
          eq(moneyTransactions.toUserId, ADAM_PERSONA_CONFIG.userId),
        ),
      )
      .orderBy(desc(moneyTransactions.createdAt))
      .limit(limit);

    // 收集交易对手方的用户 ID，用于批量查询用户名
    const userIds = new Set<string>();
    for (const row of rows) {
      if (row.fromUserId !== ADAM_PERSONA_CONFIG.userId) userIds.add(row.fromUserId);
      if (row.toUserId !== ADAM_PERSONA_CONFIG.userId) userIds.add(row.toUserId);
    }

    // 批量查询对手方用户名，构建 userId -> username 映射
    const usernameMap = new Map<string, string>();
    if (userIds.size > 0) {
      const userRows = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(or(...[...userIds].map((userId) => eq(users.id, userId))));
      for (const userRow of userRows) {
        usernameMap.set(userRow.id, userRow.username);
      }
    }

    const transactions: AdamTransactionRecord[] = rows.map((row) => {
      const isOutgoing = row.fromUserId === ADAM_PERSONA_CONFIG.userId;
      const counterpartyId = isOutgoing ? row.toUserId : row.fromUserId;
      return {
        id: row.id,
        direction: isOutgoing ? "out" : "in",
        counterparty: usernameMap.get(counterpartyId) ?? "未知",
        amount: Number(row.amount),
        type: row.type,
        description: row.description,
        createdAt: row.createdAt,
      };
    });

    return {
      money: adamRow ? Number(adamRow.money) : 0,
      transactions,
    };
  }
}

export const personQueryRepository: PersonQueryRepository =
  new DrizzlePersonQueryRepository();
