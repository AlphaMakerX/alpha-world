import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { getUpgradeCost } from "@/server/features/factory/application/upgrade-cost-catalog";
import type { Factory } from "@/server/features/factory/domain/entities/factory";
import type { FactoryRepository } from "@/server/features/factory/domain/repositories/factory-repository";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { FinanceService } from "@/server/features/finance/domain/finance-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import type { User } from "@/server/features/person/domain/entities/user";

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
  factoryRepository: FactoryRepository;
  buildingRepository: BuildingRepository;
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  financeService: FinanceService;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 校验通过后的上下文，包含业务逻辑所需的已验证数据 */
type ValidatedContext = {
  factory: Factory;
  owner: User;
  adam: User;
  cost: number;
};

/** 校验升级工厂的前置条件 */
async function validate(
  command: UpgradeFactoryCommand,
  deps: UpgradeFactoryUseCaseDeps,
): Promise<ValidatedContext | UpgradeFactoryFailureResult> {
  const factory = await deps.factoryRepository.findByBuildingId(command.buildingId);
  if (!factory) {
    return { ok: false, error: "该建筑不是工厂", code: "NOT_FOUND" };
  }

  const plot = await deps.plotRepository.findById(factory.plotId);
  if (!plot) {
    return { ok: false, error: "地块不存在", code: "NOT_FOUND" };
  }
  if (plot.ownerUserId !== command.ownerUserId) {
    return { ok: false, error: "只能操作自己地块上的工厂", code: "CONFLICT" };
  }

  const cost = getUpgradeCost(factory.level);
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

  return { factory, owner, adam, cost };
}

/** 判断校验结果是否为失败（或成功的早返回） */
function isFailure(result: ValidatedContext | UpgradeFactoryFailureResult): result is UpgradeFactoryFailureResult {
  return "ok" in result;
}

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
  const validated = await validate(command, deps);
  if (isFailure(validated)) return validated;
  const { factory, owner, adam, cost } = validated;

  await deps.transact(async () => {
    factory.upgrade();
    await deps.factoryRepository.save(factory);
    await deps.financeService.transfer({
      payer: owner,
      receiver: adam,
      amount: cost,
      type: "factory_upgrade",
      referenceId: String(factory.id),
      description: `工厂升级至 ${factory.level} 级`,
    });
  });

  return {
    ok: true,
    building: { id: factory.id, level: factory.level },
  };
}
