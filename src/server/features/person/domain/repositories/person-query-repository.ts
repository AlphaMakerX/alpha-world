export type WealthLeaderboardItem = {
  username: string;
  money: number;
};

export type AdamTransactionRecord = {
  id: number;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: Date;
};

export interface PersonQueryRepository {
  listWealthLeaderboard(limit: number): Promise<WealthLeaderboardItem[]>;
  getAdamProfile(limit: number): Promise<{
    money: number;
    transactions: AdamTransactionRecord[];
  }>;
}
