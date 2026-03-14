export type MoneyTransactionType =
  | "registration_grant"
  | "plot_purchase"
  | "building_construction"
  | "factory_production"
  | "shop_purchase"
  | "buy_order_fulfilled";

export interface TransactionLedgerRepository {
  record(entry: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    type: MoneyTransactionType;
    referenceId?: string;
    description?: string;
  }): Promise<void>;
}
