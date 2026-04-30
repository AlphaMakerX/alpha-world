/**
 * 查询住宅休息任务列表用例
 */
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { RestJobRepository } from "@/server/features/residential/domain/repositories/rest-job-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 查询命令参数 */
export type ListRestJobsCommand = {
  buildingId: number;
};

type RestJobSnapshot = {
  id: number;
  buildingId: number;
  ownerUserId: string;
  resterUserId: string;
  restType: string;
  staminaGain: number;
  cost: number;
  status: string;
  startedAt: Date;
  finishAt: Date;
  collectedAt: Date | null;
};

type ListRestJobsResult =
  | { ok: true; jobs: RestJobSnapshot[] }
  | { ok: false; error: string; code: UseCaseErrorCode };

/** 用例所需的外部依赖 */
export type ListRestJobsUseCaseDeps = {
  buildingRepository: BuildingRepository;
  restJobRepository: RestJobRepository;
};

/** 执行查询休息任务列表用例 */
export async function executeListRestJobsUseCase(
  command: ListRestJobsCommand,
  deps: ListRestJobsUseCaseDeps,
): Promise<ListRestJobsResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }
  if (building.type !== "residential") {
    return { ok: false, error: "当前建筑不是住宅", code: "CONFLICT" };
  }

  const jobs = await deps.restJobRepository.findByBuildingId(building.id);

  return {
    ok: true,
    jobs: jobs.map((job) => ({
      id: job.id,
      buildingId: job.buildingId,
      ownerUserId: job.ownerUserId,
      resterUserId: job.resterUserId,
      restType: job.restType,
      staminaGain: job.staminaGain,
      cost: job.cost,
      status: job.status,
      startedAt: job.startedAt,
      finishAt: job.finishAt,
      collectedAt: job.collectedAt,
    })),
  };
}
