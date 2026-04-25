import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { getUpgradeCost } from "@/server/features/factory/application/upgrade-cost-catalog";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 升级工厂的命令参数 */
export type UpgradeFactoryCommand = {
  ownerUserId: string;
  buildingId: number;
};

type UpgradeFactorySuccessResult = {
  ok: true;
  building: { id: number; level: number };
};
type UpgradeFactoryFailureResult = { ok: false; error: string; code: UseCaseErrorCode };
export type UpgradeFactoryResult = UpgradeFactorySuccessResult | UpgradeFactoryFailureResult;

/** 升级工厂用例所需的外部依赖 */
export type UpgradeFactoryUseCaseDeps = {
  buildingRepository: BuildingRepository;
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/**
 * 执行升级工厂用例
 *
 * 流程：获取建筑 → ensureFactory → 校验归属 → 计算费用 → 校验金币 →
 *       事务内扣款 + upgrade + save + 记录流水
 */
export async function executeUpgradeFactoryUseCase(
  command: UpgradeFactoryCommand,
  deps: UpgradeFactoryUseCaseDeps,
): Promise<UpgradeFactoryResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }

  try {
    building.ensureFactory();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  const plot = await deps.plotRepository.findById(building.plotId);
  if (!plot) {
    return { ok: false, error: "地块不存在", code: "NOT_FOUND" };
  }
  if (plot.ownerUserId !== command.ownerUserId) {
    return { ok: false, error: "只能操作自己地块上的工厂", code: "CONFLICT" };
  }

  const cost = getUpgradeCost(building.level);
  if (cost === null) {
    return { ok: false, error: "已达最高等级", code: "CONFLICT" };
  }

  const owner = await deps.userRepository.findById(command.ownerUserId);
  if (!owner) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }
  if (owner.money < cost) {
    return { ok: false, error: "金币不足", code: "CONFLICT" };
  }

  const adam = await deps.systemAccountService.getSystemAccount();

  await deps.transact(async () => {
    owner.spendMoney(cost);
    adam.receiveMoney(cost);
    building.upgrade();
    await deps.userRepository.save(owner);
    await deps.userRepository.save(adam);
    await deps.buildingRepository.save(building);
    await deps.transactionLedgerRepository.record({
      fromUserId: command.ownerUserId,
      toUserId: adam.id,
      amount: cost,
      type: "factory_upgrade",
      referenceId: String(building.id),
      description: `工厂升级至 ${building.level} 级`,
    });
  });

  return {
    ok: true,
    building: { id: building.id, level: building.level },
  };
}
