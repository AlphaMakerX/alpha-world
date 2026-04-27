import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { Building, type BuildingType } from "@/server/features/building/domain";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { User } from "@/server/features/person/domain/entities/user";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { FinanceService } from "@/server/features/finance/application/services/finance-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 建造成功的返回结果 */
type BuildBuildingSuccessResult = {
  ok: true;
  building: ReturnType<Building["toSnapshot"]>;
};

/** 建造失败的返回结果 */
type BuildBuildingFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 建造建筑用例的返回类型（成功 | 失败） */
export type BuildBuildingResult = BuildBuildingSuccessResult | BuildBuildingFailureResult;

/** 建造建筑的命令参数 */
export type BuildBuildingCommand = {
  ownerUserId: string;
  plotId: number;
  buildingType: BuildingType;
  factorySubtype?: string;
};

/** 建造建筑用例所需的外部依赖 */
export type BuildBuildingUseCaseDeps = {
  buildingRepository: BuildingRepository;
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  financeService: FinanceService;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
  /** 工厂建成后自动解锁默认配方，由 composition root 注入 */
  unlockDefaultRecipes: (building: Building) => Promise<void>;
};

/** 校验通过后返回的上下文 */
type ValidatedContext = {
  owner: User;
  adam: User;
};

/** 校验建造前置条件，通过则返回上下文，失败则返回错误结果 */
async function validate(
  command: BuildBuildingCommand,
  deps: BuildBuildingUseCaseDeps,
): Promise<ValidatedContext | BuildBuildingFailureResult> {
  const plot = await deps.plotRepository.findById(command.plotId);
  if (!plot) {
    return { ok: false, error: "地块不存在", code: "NOT_FOUND" };
  }
  if (plot.ownerUserId !== command.ownerUserId) {
    return { ok: false, error: "只能在自己的地块建造", code: "CONFLICT" };
  }

  const existingBuilding = await deps.buildingRepository.findByPlotId(command.plotId);
  if (existingBuilding) {
    return { ok: false, error: "该地块已有建筑", code: "CONFLICT" };
  }

  const owner = await deps.userRepository.findById(command.ownerUserId);
  if (!owner) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  const adam = await deps.systemAccountService.getSystemAccount();

  return { owner, adam };
}

function isFailure(result: ValidatedContext | BuildBuildingFailureResult): result is BuildBuildingFailureResult {
  return "ok" in result && !result.ok;
}

/**
 * 执行建造建筑用例
 *
 * 流程：校验地块与用户 -> 计算费用 -> 事务内（建造、扣款、解锁配方）
 */
export async function executeBuildBuildingUseCase(
  command: BuildBuildingCommand,
  deps: BuildBuildingUseCaseDeps,
): Promise<BuildBuildingResult> {
  const validated = await validate(command, deps);
  if (isFailure(validated)) return validated;

  const { owner, adam } = validated;

  try {
    const cost = Building.getCost(command.buildingType, command.factorySubtype);

    const building = await deps.transact(async () => {
      const building = Building.construct({
        plotId: command.plotId,
        type: command.buildingType,
        subtype: command.factorySubtype,
      });

      const saved = await deps.buildingRepository.save(building);

      await deps.financeService.transfer({
        payer: owner,
        receiver: adam,
        amount: cost,
        type: "building_construction",
        referenceId: String(saved.id),
        description: `建造${command.buildingType} @ 地块 ${command.plotId}`,
      });

      if (saved.type === "factory") {
        await deps.unlockDefaultRecipes(saved);
      }

      return saved;
    });

    return {
      ok: true,
      building: building.toSnapshot(),
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        ok: false,
        error: error.message,
        code: "CONFLICT",
      };
    }
    throw error;
  }
}
