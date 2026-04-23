/**
 * 查询我的建筑列表用例
 *
 * 根据用户 ID 查询其名下所有建筑并返回。
 */
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 查询命令参数 */
export type ListMyBuildingsCommand = {
  ownerUserId: string;
};

/** 查询成功的返回结果 */
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

/** 查询失败的返回结果 */
type ListMyBuildingsFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 用例返回类型（成功 | 失败） */
export type ListMyBuildingsResult =
  | ListMyBuildingsSuccessResult
  | ListMyBuildingsFailureResult;

/** 用例所需的外部依赖 */
export type ListMyBuildingsUseCaseDeps = {
  buildingRepository: BuildingRepository;
};

/** 执行查询我的建筑列表用例 */
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
