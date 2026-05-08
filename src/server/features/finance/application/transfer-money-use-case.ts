/**
 * 直接转账用例
 *
 * 已认证用户向另一个用户直接转账金币。
 */
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { FinanceService } from "@/server/features/finance/application/services/finance-service";
import { Username } from "@/server/features/person/domain/value-objects/username";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 转账命令参数 */
export type TransferMoneyCommand = {
  payerUserId: string;
  toUsername: string;
  amount: number;
  description?: string;
};

type TransferMoneyResult =
  | { ok: true; transfer: { fromUsername: string; toUsername: string; amount: number } }
  | { ok: false; error: string; code: UseCaseErrorCode };

/** 用例所需的外部依赖 */
export type TransferMoneyUseCaseDeps = {
  userRepository: UserRepository;
  financeService: FinanceService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 执行直接转账用例 */
export async function executeTransferMoneyUseCase(
  command: TransferMoneyCommand,
  deps: TransferMoneyUseCaseDeps,
): Promise<TransferMoneyResult> {
  // 查找付款人
  const payer = await deps.userRepository.findById(command.payerUserId);
  if (!payer) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  // 查找收款人
  const toUsername = Username.create(command.toUsername);
  const receiver = await deps.userRepository.findByUsername(toUsername);
  if (!receiver) {
    return { ok: false, error: "收款用户不存在", code: "NOT_FOUND" };
  }

  // 不能转账给自己
  if (payer.id === receiver.id) {
    return { ok: false, error: "不能转账给自己", code: "CONFLICT" };
  }

  // 校验余额
  if (payer.money < command.amount) {
    return { ok: false, error: "余额不足，转账失败", code: "CONFLICT" };
  }

  // 事务执行转账
  await deps.transact(async () => {
    await deps.financeService.transfer({
      payer,
      receiver,
      amount: command.amount,
      type: "direct_transfer",
      description: command.description ?? `转账 → ${receiver.username.getValue()}`,
    });
  });

  return {
    ok: true,
    transfer: {
      fromUsername: payer.username.getValue(),
      toUsername: receiver.username.getValue(),
      amount: command.amount,
    },
  };
}
