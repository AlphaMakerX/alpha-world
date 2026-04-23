/**
 * 收购站交易查询仓储接口定义
 *
 * 定义了收购站交易记录的查询模型和仓储接口，
 * 用于查询指定收购站建筑的历史成交交易记录。
 */

/** 收购站交易记录（只读查询模型） */
export type PurchasingStationTransactionRecord = {
  id: number;
  /** 卖家用户名 */
  sellerUsername: string;
  /** 交易金额 */
  amount: number;
  /** 交易描述 */
  description: string | null;
  createdAt: Date;
};

/** 收购站交易查询仓储接口 */
export interface PurchasingStationTransactionQueryRepository {
  /** 根据建筑 ID 查询交易记录列表，按时间倒序排列 */
  listByBuildingId(
    buildingId: number,
    limit: number,
  ): Promise<PurchasingStationTransactionRecord[]>;
}
