import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { ADAM_USER_ID } from "@/server/features/shared-kernel/domain/adam";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";

export type PurchasePlotCommand = {
  plotId: number;
  buyerUserId: string;
};

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

type PurchasePlotFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type PurchasePlotResult = PurchasePlotSuccessResult | PurchasePlotFailureResult;

export type PurchasePlotUseCaseDeps = {
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

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

  const adam = await deps.userRepository.findById(ADAM_USER_ID);
  if (!adam) {
    return { ok: false, error: "系统尚未初始化", code: "BAD_REQUEST" };
  }

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

  await deps.transact(async () => {
    await deps.userRepository.save(buyer);
    await deps.userRepository.save(adam);
    await deps.plotRepository.save(plot);
    await deps.transactionLedgerRepository.record({
      fromUserId: command.buyerUserId,
      toUserId: ADAM_USER_ID,
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
