/**
 * 交易流水仓储的 Drizzle ORM 实现
 *
 * 将资金交易记录写入 money_transactions 表。
 */
import { getDbClient } from "@/server/lib/db";
import type { TransactionLedgerRepository } from "@/server/features/finance/domain/repositories/transaction-ledger-repository";
import { moneyTransactions } from "@/server/features/finance/infrastructure/schema";

/** 基于 Drizzle ORM 的交易流水仓储实现 */
export class DrizzleTransactionLedgerRepository implements TransactionLedgerRepository {
  /** 记录一笔交易流水到数据库 */
  async record(entry: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    type: string;
    referenceId?: string;
    description?: string;
  }): Promise<void> {
    await getDbClient().insert(moneyTransactions).values({
      fromUserId: entry.fromUserId,
      toUserId: entry.toUserId,
      amount: entry.amount.toString(),
      type: entry.type,
      referenceId: entry.referenceId ?? null,
      description: entry.description ?? null,
    });
  }
}

export const transactionLedgerRepository: TransactionLedgerRepository =
  new DrizzleTransactionLedgerRepository();
