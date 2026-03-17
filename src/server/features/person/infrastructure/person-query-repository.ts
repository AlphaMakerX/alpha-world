import { desc, eq, or } from "drizzle-orm";
import { db } from "@/server/lib/db";
import type {
  AdamTransactionRecord,
  PersonQueryRepository,
  WealthLeaderboardItem,
} from "@/server/features/person/domain/repositories/person-query-repository";
import { moneyTransactions, users } from "@/server/features/person/infrastructure/schema";
import { ADAM_USER_ID } from "@/server/features/shared-kernel/domain/adam";

class DrizzlePersonQueryRepository implements PersonQueryRepository {
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

  async getAdamProfile(limit: number): Promise<{
    money: number;
    transactions: AdamTransactionRecord[];
  }> {
    const adamRow = await db.query.users.findFirst({
      where: eq(users.id, ADAM_USER_ID),
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
          eq(moneyTransactions.fromUserId, ADAM_USER_ID),
          eq(moneyTransactions.toUserId, ADAM_USER_ID),
        ),
      )
      .orderBy(desc(moneyTransactions.createdAt))
      .limit(limit);

    const userIds = new Set<string>();
    for (const row of rows) {
      if (row.fromUserId !== ADAM_USER_ID) userIds.add(row.fromUserId);
      if (row.toUserId !== ADAM_USER_ID) userIds.add(row.toUserId);
    }

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
      const isOutgoing = row.fromUserId === ADAM_USER_ID;
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
