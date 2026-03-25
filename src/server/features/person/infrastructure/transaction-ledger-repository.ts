import { getDbClient } from "@/server/lib/db";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import { moneyTransactions } from "@/server/features/person/infrastructure/schema";

export class DrizzleTransactionLedgerRepository implements TransactionLedgerRepository {
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
