export type MoneyTransactionType =
  | "registration_grant"
  | "plot_purchase"
  | "building_construction"
  | "factory_production"
  | "shop_purchase";

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
