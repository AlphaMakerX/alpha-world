import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { Building } from "@/server/features/building/domain";
import { getBuildingCost } from "@/server/features/building/application/building-cost-catalog";
import { isValidFactorySubtype } from "@/server/features/building/domain/factory-subtype";
import type { FactorySubtype } from "@/server/features/building/domain/factory-subtype";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import { autoUnlockDefaultRecipes } from "@/server/features/factory/application/auto-unlock-default-recipes";

/** 建造成功的返回结果 */
type BuildBuildingSuccessResult = {
  ok: true;
  building: {
    id: number;
    plotId: number;
    type: "residential" | "factory" | "shop" | "purchasing_station";
    subtype: FactorySubtype | null;
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
  transactionLedgerRepository: TransactionLedgerRepository;
  unlockedRecipeRepository: UnlockedRecipeRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/**
 * 执行建造建筑用例
 *
 * 流程：校验地块 -> 校验子类型 -> 检查是否已有建筑 -> 计算费用 -> 事务内扣款、建造、记录流水
 */
export async function executeBuildBuildingUseCase(
  command: BuildBuildingCommand,
  deps: BuildBuildingUseCaseDeps,
): Promise<BuildBuildingResult> {
  // 工厂类型校验：必须提供有效子类型
  if (command.buildingType === "factory") {
    if (!command.factorySubtype) {
      return {
        ok: false,
        error: "工厂类型建筑必须指定子类型",
        code: "CONFLICT",
      };
    }
    if (!isValidFactorySubtype(command.factorySubtype)) {
      return {
        ok: false,
        error: `无效的工厂子类型: ${command.factorySubtype}`,
        code: "CONFLICT",
      };
    }
  }

  const plot = await deps.plotRepository.findById(command.plotId);
  if (!plot) {
    return {
      ok: false,
      error: "地块不存在",
      code: "NOT_FOUND",
    };
  }
  if (plot.ownerUserId !== command.ownerUserId) {
    return {
      ok: false,
      error: "只能在自己的地块建造",
      code: "CONFLICT",
    };
  }

  const existingBuilding = await deps.buildingRepository.findByPlotId(command.plotId);
  if (existingBuilding) {
    return {
      ok: false,
      error: "该地块已有建筑",
      code: "CONFLICT",
    };
  }

  // 根据建筑类型和子类型查询建造费用
  const cost = getBuildingCost(command.buildingType, command.factorySubtype);

  const owner = await deps.userRepository.findById(command.ownerUserId);
  if (!owner) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  // 获取系统账户（用于接收建造费用）
  const adam = await deps.systemAccountService.getSystemAccount();

  try {
    // 在事务中完成扣款、建造和交易记录
    const savedBuilding = await deps.transact(async () => {
      // 从用户扣款并转入系统账户
      if (cost > 0) {
        owner.spendMoney(cost);
        adam.receiveMoney(cost);
      }

      const building = Building.construct({
        id: 0,
        plotId: command.plotId,
        type: command.buildingType,
        subtype: command.buildingType === "factory"
          ? (command.factorySubtype as FactorySubtype)
          : undefined,
      });

      await deps.userRepository.save(owner);
      await deps.userRepository.save(adam);
      const savedBuilding = await deps.buildingRepository.save(building);

      if (cost > 0) {
        await deps.transactionLedgerRepository.record({
          fromUserId: command.ownerUserId,
          toUserId: adam.id,
          amount: cost,
          type: "building_construction",
          referenceId: String(savedBuilding.id),
          description: `建造${command.buildingType} @ 地块 ${command.plotId}`,
        });
      }

      // 工厂建成后自动解锁默认配方
      if (command.buildingType === "factory" && command.factorySubtype) {
        await autoUnlockDefaultRecipes(
          savedBuilding.id,
          command.factorySubtype,
          deps.unlockedRecipeRepository,
        );
      }

      return savedBuilding;
    });

    return {
      ok: true,
      building: {
        id: savedBuilding.id,
        plotId: savedBuilding.plotId,
        type: savedBuilding.type,
        subtype: savedBuilding.subtype,
        level: savedBuilding.level,
        status: savedBuilding.status,
        createdAt: savedBuilding.createdAt,
        updatedAt: savedBuilding.updatedAt,
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
