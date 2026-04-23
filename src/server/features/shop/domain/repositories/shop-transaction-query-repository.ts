/**
 * 商店交易查询仓储接口定义
 *
 * 定义了商店交易记录的查询模型和仓储接口，
 * 用于查询指定商店建筑的历史购买交易记录。
 */

/** 商店交易记录（只读查询模型） */
export type ShopTransactionRecord = {
  id: number;
  /** 买家用户名 */
  buyerUsername: string;
  /** 交易金额 */
  amount: number;
  /** 交易描述 */
  description: string | null;
  createdAt: Date;
};

/** 商店交易查询仓储接口 */
export interface ShopTransactionQueryRepository {
  /** 根据建筑 ID 查询交易记录列表，按时间倒序排列 */
  listByBuildingId(buildingId: number, limit: number): Promise<ShopTransactionRecord[]>;
}
