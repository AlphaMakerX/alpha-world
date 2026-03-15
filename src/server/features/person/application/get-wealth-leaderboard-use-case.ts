import { desc } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { users } from "@/server/features/person/infrastructure/schema";
import {
  ADAM_INITIAL_MONEY,
  ADAM_USERNAME,
} from "@/server/features/shared-kernel/domain/adam";

export type LeaderboardEntry = {
  rank: number;
  username: string;
  money: number;
  isAdam: boolean;
};

export type GetWealthLeaderboardResult = {
  ok: true;
  entries: LeaderboardEntry[];
  totalMoneySupply: number;
};

export async function executeGetWealthLeaderboardUseCase(): Promise<GetWealthLeaderboardResult> {
  const rows = await db
    .select({
      username: users.username,
      money: users.money,
    })
    .from(users)
    .orderBy(desc(users.money))
    .limit(50);

  const entries: LeaderboardEntry[] = rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    money: Number(row.money),
    isAdam: row.username === ADAM_USERNAME,
  }));

  return { ok: true, entries, totalMoneySupply: ADAM_INITIAL_MONEY };
}
