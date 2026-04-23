/**
 * 交易流水仓储接口（领域层）
 *
 * 定义资金交易记录的写入能力，用于追踪系统内所有资金流转。
 */

/** 资金交易类型枚举 */
export type MoneyTransactionType =
  | "registration_grant"
  | "system_init_transfer"
  | "plot_purchase"
  | "building_construction"
  | "factory_production"
  | "shop_purchase"
  | "buy_order_fulfilled";

/** 交易流水仓储接口 */
export interface TransactionLedgerRepository {
  /** 记录一笔资金交易流水 */
  record(entry: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    type: MoneyTransactionType;
    referenceId?: string;
    description?: string;
  }): Promise<void>;
}
