import type { PersonQueryRepository } from "@/server/features/person/domain/repositories/person-query-repository";
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

export type GetWealthLeaderboardUseCaseDeps = {
  personQueryRepository: PersonQueryRepository;
};

export async function executeGetWealthLeaderboardUseCase(
  deps: GetWealthLeaderboardUseCaseDeps,
): Promise<GetWealthLeaderboardResult> {
  const rows = await deps.personQueryRepository.listWealthLeaderboard(50);

  const entries: LeaderboardEntry[] = rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    money: row.money,
    isAdam: row.username === ADAM_USERNAME,
  }));

  return { ok: true, entries, totalMoneySupply: ADAM_INITIAL_MONEY };
}
