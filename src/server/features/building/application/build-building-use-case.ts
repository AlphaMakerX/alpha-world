import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { Building } from "@/server/features/building/domain";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { FinanceService } from "@/server/features/finance/domain/finance-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 建造成功的返回结果 */
type BuildBuildingSuccessResult = {
  ok: true;
  building: {
    id: number;
    plotId: number;
    type: "residential" | "factory" | "shop" | "purchasing_station";
    subtype: string | null;
    level: number;
    status: "active";
    createdAt: Date;
    updatedAt: Date;
  };
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
  buildingType: "residential" | "factory" | "shop" | "purchasing_station";
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
  unlockDefaultRecipes?: (building: Building) => Promise<void>;
};

/** 校验建造前置条件，失败则返回错误结果 */
async function validate(
  command: BuildBuildingCommand,
  deps: BuildBuildingUseCaseDeps,
): Promise<BuildBuildingFailureResult | null> {
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

  return null;
}

/**
 * 执行建造建筑用例
 *
 * 流程：校验地块 -> 计算费用 -> 事务内（建造、扣款、钩子）
 */
export async function executeBuildBuildingUseCase(
  command: BuildBuildingCommand,
  deps: BuildBuildingUseCaseDeps,
): Promise<BuildBuildingResult> {
  const failure = await validate(command, deps);
  if (failure) return failure;

  const owner = await deps.userRepository.findById(command.ownerUserId);
  if (!owner) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  const adam = await deps.systemAccountService.getSystemAccount();

  try {
    const cost = Building.getCost(command.buildingType, command.factorySubtype);

    const building = await deps.transact(async () => {
      const building = Building.construct({
        id: 0,
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

      if (saved.type === "factory" && deps.unlockDefaultRecipes) {
        await deps.unlockDefaultRecipes(saved);
      }

      return saved;
    });

    return {
      ok: true,
      building: {
        id: building.id,
        plotId: building.plotId,
        type: building.type,
        subtype: building.subtype,
        level: building.level,
        status: building.status,
        createdAt: building.createdAt,
        updatedAt: building.updatedAt,
      },
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
