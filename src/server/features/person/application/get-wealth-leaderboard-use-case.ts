import { desc, ne } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { users } from "@/server/features/person/infrastructure/schema";
import { ADAM_USER_ID } from "@/server/features/shared-kernel/domain/adam";

export type LeaderboardEntry = {
  rank: number;
  username: string;
  money: number;
};

export type GetWealthLeaderboardResult = {
  ok: true;
  entries: LeaderboardEntry[];
};

export async function executeGetWealthLeaderboardUseCase(): Promise<GetWealthLeaderboardResult> {
  const rows = await db
    .select({
      username: users.username,
      money: users.money,
    })
    .from(users)
    .where(ne(users.id, ADAM_USER_ID))
    .orderBy(desc(users.money))
    .limit(50);

  const entries: LeaderboardEntry[] = rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    money: Number(row.money),
  }));

  return { ok: true, entries };
}
