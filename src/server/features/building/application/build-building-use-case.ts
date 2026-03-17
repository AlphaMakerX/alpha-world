import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { Building } from "@/server/features/building/domain";
import { getBuildingCost } from "@/server/features/building/application/building-cost-catalog";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

type BuildBuildingSuccessResult = {
  ok: true;
  building: {
    id: number;
    plotId: number;
    type: "residential" | "factory" | "shop" | "purchasing_station";
    status: "active";
    createdAt: Date;
    updatedAt: Date;
  };
};

type BuildBuildingFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type BuildBuildingResult = BuildBuildingSuccessResult | BuildBuildingFailureResult;
export type BuildBuildingCommand = {
  ownerUserId: string;
  plotId: number;
  buildingType: "residential" | "factory" | "shop" | "purchasing_station";
};

export type BuildBuildingUseCaseDeps = {
  buildingRepository: BuildingRepository;
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executeBuildBuildingUseCase(
  command: BuildBuildingCommand,
  deps: BuildBuildingUseCaseDeps,
): Promise<BuildBuildingResult> {
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

  const cost = getBuildingCost(command.buildingType);

  const owner = await deps.userRepository.findById(command.ownerUserId);
  if (!owner) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  const adam = await deps.systemAccountService.getSystemAccount();

  try {
    const savedBuilding = await deps.transact(async () => {
      if (cost > 0) {
        owner.spendMoney(cost);
        adam.receiveMoney(cost);
      }

      const building = Building.construct({
        id: 0,
        plotId: command.plotId,
        type: command.buildingType,
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
      return savedBuilding;
    });

    return {
      ok: true,
      building: {
        id: savedBuilding.id,
        plotId: savedBuilding.plotId,
        type: savedBuilding.type,
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
