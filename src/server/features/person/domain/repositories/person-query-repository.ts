/**
 * 人员查询仓储接口（领域层）
 *
 * 定义面向查询的只读仓储，包括财富排行榜和 Adam 资金概况等读模型查询。
 */

/** 财富排行榜单条记录 */
export type WealthLeaderboardItem = {
  username: string;
  money: number;
};

/** Adam 交易流水记录 */
export type AdamTransactionRecord = {
  id: number;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: Date;
};

/** 人员查询仓储接口，提供只读查询操作 */
export interface PersonQueryRepository {
  /** 查询财富排行榜，按金额降序返回前 limit 名用户 */
  listWealthLeaderboard(limit: number): Promise<WealthLeaderboardItem[]>;
  /** 获取 Adam 账户概况：当前余额及最近交易记录 */
  getAdamProfile(limit: number): Promise<{
    money: number;
    transactions: AdamTransactionRecord[];
  }>;
}
