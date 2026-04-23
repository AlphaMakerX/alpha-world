/**
 * 获取财富排行榜用例
 *
 * 查询全服玩家财富排行榜（前 50 名），并标记系统账户 Adam。
 */
import type { PersonQueryRepository } from "@/server/features/person/domain/repositories/person-query-repository";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";

/** 排行榜单条记录 */
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

/** 执行财富排行榜查询，返回排名列表和系统总货币供应量 */
export async function executeGetWealthLeaderboardUseCase(
  deps: GetWealthLeaderboardUseCaseDeps,
): Promise<GetWealthLeaderboardResult> {
  const rows = await deps.personQueryRepository.listWealthLeaderboard(50);

  const entries: LeaderboardEntry[] = rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    money: row.money,
    isAdam: row.username === ADAM_PERSONA_CONFIG.username,
  }));

  return { ok: true, entries, totalMoneySupply: ADAM_PERSONA_CONFIG.initialMoney };
}
