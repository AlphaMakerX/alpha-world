/**
 * 财务领域服务
 *
 * 封装系统内所有资金流转操作，包括转账、冻结、退款和释放。
 * 所有金额变动通过 User 实体的 spendMoney/receiveMoney 方法执行，
 * 并在需要时自动记录交易流水。
 */
import type { User } from "@/server/features/person/domain/entities/user";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type {
  TransactionLedgerRepository,
  MoneyTransactionType,
} from "@/server/features/finance/domain/repositories/transaction-ledger-repository";

/** 转账参数 */
export type TransferParams = {
  payer: User;
  receiver: User;
  amount: number;
  type: MoneyTransactionType;
  referenceId?: string;
  description?: string;
};

/** 冻结资金参数 */
export type FreezeParams = {
  payer: User;
  amount: number;
};

/** 退款参数 */
export type RefundParams = {
  recipient: User;
  amount: number;
};

/** 释放冻结资金给收款方参数 */
export type ReleaseParams = {
  recipient: User;
  frozenByUserId: string;
  amount: number;
  type: MoneyTransactionType;
  referenceId?: string;
  description?: string;
};

/** 财务服务接口 */
export interface FinanceService {
  /** 转账：从 payer 扣款，receiver 收款，保存双方并记录流水 */
  transfer(params: TransferParams): Promise<void>;
  /** 冻结资金：仅从 payer 扣款并保存，不转给任何人，不记录流水 */
  freeze(params: FreezeParams): Promise<void>;
  /** 退款：向 recipient 退还资金并保存 */
  refund(params: RefundParams): Promise<void>;
  /** 释放冻结资金：向 recipient 发放已冻结的资金并记录流水 */
  release(params: ReleaseParams): Promise<void>;
}

/** 财务服务的默认实现 */
export class FinanceServiceImpl implements FinanceService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly transactionLedgerRepository: TransactionLedgerRepository,
  ) {}

  async transfer(params: TransferParams): Promise<void> {
    if (params.amount <= 0) return;

    params.payer.spendMoney(params.amount);
    params.receiver.receiveMoney(params.amount);
    await this.userRepository.save(params.payer);
    await this.userRepository.save(params.receiver);
    await this.transactionLedgerRepository.record({
      fromUserId: params.payer.id,
      toUserId: params.receiver.id,
      amount: params.amount,
      type: params.type,
      referenceId: params.referenceId,
      description: params.description,
    });
  }

  async freeze(params: FreezeParams): Promise<void> {
    if (params.amount <= 0) return;

    params.payer.spendMoney(params.amount);
    await this.userRepository.save(params.payer);
  }

  async refund(params: RefundParams): Promise<void> {
    if (params.amount <= 0) return;

    params.recipient.receiveMoney(params.amount);
    await this.userRepository.save(params.recipient);
  }

  async release(params: ReleaseParams): Promise<void> {
    if (params.amount <= 0) return;

    params.recipient.receiveMoney(params.amount);
    await this.userRepository.save(params.recipient);
    await this.transactionLedgerRepository.record({
      fromUserId: params.frozenByUserId,
      toUserId: params.recipient.id,
      amount: params.amount,
      type: params.type,
      referenceId: params.referenceId,
      description: params.description,
    });
  }
}
