/**
 * 购买地块用例
 *
 * 处理玩家购买地块的完整流程：校验地块和用户状态、执行资金转移、
 * 更新地块归属、记录交易流水。所有写操作在事务中执行。
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";

/** 购买地块命令参数 */
export type PurchasePlotCommand = {
  plotId: number;
  buyerUserId: string;
};

/** 购买成功的返回结构 */
type PurchasePlotSuccessResult = {
  ok: true;
  plot: {
    id: number;
    x: number;
    y: number;
    ownerUserId: string | null;
    status: "available" | "owned" | "locked";
    price: number;
    createdAt: Date;
    updatedAt: Date;
  };
};

/** 购买失败的返回结构 */
type PurchasePlotFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type PurchasePlotResult = PurchasePlotSuccessResult | PurchasePlotFailureResult;

/** 用例依赖，包含仓储、服务和事务函数 */
export type PurchasePlotUseCaseDeps = {
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 执行购买地块用例：校验 -> 扣款/收款 -> 更新归属 -> 记录流水（事务内） */
export async function executePurchasePlotUseCase(
  command: PurchasePlotCommand,
  deps: PurchasePlotUseCaseDeps,
): Promise<PurchasePlotResult> {
  const plot = await deps.plotRepository.findById(command.plotId);
  if (!plot) {
    return { ok: false, error: "地块不存在", code: "NOT_FOUND" };
  }

  const buyer = await deps.userRepository.findById(command.buyerUserId);
  if (!buyer) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  const adam = await deps.systemAccountService.getSystemAccount();

  // 执行领域操作：买家扣款、系统账户收款、地块变更归属
  try {
    buyer.spendMoney(plot.price);
    adam.receiveMoney(plot.price);
    plot.purchaseBy(command.buyerUserId);
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  // 在事务中持久化所有变更
  await deps.transact(async () => {
    await deps.userRepository.save(buyer);
    await deps.userRepository.save(adam);
    await deps.plotRepository.save(plot);
    await deps.transactionLedgerRepository.record({
      fromUserId: command.buyerUserId,
      toUserId: adam.id,
      amount: plot.price,
      type: "plot_purchase",
      referenceId: String(plot.id),
      description: `购买地块 (${plot.coordinate.getX()}, ${plot.coordinate.getY()})`,
    });
  });

  return {
    ok: true,
    plot: {
      id: plot.id,
      x: plot.coordinate.getX(),
      y: plot.coordinate.getY(),
      ownerUserId: plot.ownerUserId,
      status: plot.status,
      price: plot.price,
      createdAt: plot.createdAt,
      updatedAt: plot.updatedAt,
    },
  };
}
