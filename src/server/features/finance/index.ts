import { FinanceServiceImpl } from "@/server/features/finance/application/services/finance-service";
import { userRepository } from "@/server/features/person/infrastructure";
import { transactionLedgerRepository } from "@/server/features/finance/infrastructure/transaction-ledger-repository";

export { type FinanceService } from "@/server/features/finance/application/services/finance-service";

export const financeService = new FinanceServiceImpl(userRepository, transactionLedgerRepository);
