import { desc, eq, or } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { users, moneyTransactions } from "@/server/features/person/infrastructure/schema";
import { ADAM_USER_ID } from "@/server/features/shared-kernel/domain/adam";

export type AdamTransaction = {
  id: number;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
};

export type GetAdamProfileResult = {
  ok: true;
  money: number;
  transactions: AdamTransaction[];
};

const TYPE_LABELS: Record<string, string> = {
  registration_grant: "注册赠金",
  plot_purchase: "地块购买",
  building_construction: "建造建筑",
  factory_production: "工厂生产",
  shop_purchase: "商店交易",
};

export async function executeGetAdamProfileUseCase(): Promise<GetAdamProfileResult> {
  const adamRow = await db.query.users.findFirst({
    where: eq(users.id, ADAM_USER_ID),
  });

  const money = adamRow ? Number(adamRow.money) : 0;

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
    .limit(100);

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
      .where(or(...[...userIds].map((uid) => eq(users.id, uid))));
    for (const u of userRows) {
      usernameMap.set(u.id, u.username);
    }
  }

  const transactions: AdamTransaction[] = rows.map((row) => {
    const isOutgoing = row.fromUserId === ADAM_USER_ID;
    const counterpartyId = isOutgoing ? row.toUserId : row.fromUserId;
    return {
      id: row.id,
      direction: isOutgoing ? "out" : "in",
      counterparty: usernameMap.get(counterpartyId) ?? "未知",
      amount: Number(row.amount),
      type: TYPE_LABELS[row.type] ?? row.type,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
    };
  });

  return { ok: true, money, transactions };
}
