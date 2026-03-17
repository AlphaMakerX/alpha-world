import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

export type ListMyBuildingsCommand = {
  ownerUserId: string;
};

type ListMyBuildingsSuccessResult = {
  ok: true;
  buildings: Array<{
    id: number;
    plotId: number;
    type: "residential" | "factory" | "shop" | "purchasing_station";
    status: "active";
    createdAt: Date;
    updatedAt: Date;
  }>;
};

type ListMyBuildingsFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type ListMyBuildingsResult =
  | ListMyBuildingsSuccessResult
  | ListMyBuildingsFailureResult;

export type ListMyBuildingsUseCaseDeps = {
  buildingRepository: BuildingRepository;
};

export async function executeListMyBuildingsUseCase(
  command: ListMyBuildingsCommand,
  deps: ListMyBuildingsUseCaseDeps,
): Promise<ListMyBuildingsResult> {
  const buildings = await deps.buildingRepository.findByOwnerUserId(command.ownerUserId);
  return {
    ok: true,
    buildings: buildings.map((building) => ({
      id: building.id,
      plotId: building.plotId,
      type: building.type,
      status: building.status,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
    })),
  };
}
