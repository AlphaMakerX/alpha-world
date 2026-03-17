import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import { receiveFactoryOutputs } from "@/server/features/inventory/domain";
import type { FactoryProductionJobRepository } from "@/server/features/factory/domain";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";

function toOrderDto(job: {
  id: number;
  buildingId: number;
  ownerUserId: string;
  recipeId: string;
  status: "in_progress" | "collected" | "cancelled";
  startedAt: Date;
  finishAt: Date;
  collectedAt: Date | null;
  inputs: Array<{ itemKey: string; quantity: number }>;
  outputs: Array<{ itemKey: string; quantity: number }>;
}) {
  return {
    id: job.id,
    buildingId: job.buildingId,
    ownerUserId: job.ownerUserId,
    recipeId: job.recipeId,
    status: job.status,
    startedAt: job.startedAt,
    finishAt: job.finishAt,
    collectedAt: job.collectedAt,
    inputs: job.inputs,
    outputs: job.outputs,
  };
}

export type ListFactoryOrdersCommand = {
  ownerUserId: string;
  buildingId: number;
};

export type ListFactoryOrdersUseCaseDeps = {
  factoryProductionJobRepository: FactoryProductionJobRepository;
  buildingRepository: BuildingRepository;
  inventoryRepository: InventoryRepository;
  plotRepository: PlotRepository;
};

type ListFactoryOrdersSuccessResult = {
  ok: true;
  focusOrder: ReturnType<typeof toOrderDto> | null;
  historyOrders: Array<ReturnType<typeof toOrderDto>>;
};

type ListFactoryOrdersFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type ListFactoryOrdersResult = ListFactoryOrdersSuccessResult | ListFactoryOrdersFailureResult;

export async function executeListFactoryOrdersUseCase(
  command: ListFactoryOrdersCommand,
  deps: ListFactoryOrdersUseCaseDeps,
): Promise<ListFactoryOrdersResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return {
      ok: false,
      error: "建筑不存在",
      code: "NOT_FOUND",
    };
  }

  const plot = await deps.plotRepository.findById(building.plotId);
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
      error: "只能查看自己地块上的工厂订单",
      code: "CONFLICT",
    };
  }

  try {
    // 防御性校验：确保该建筑仍然是工厂，避免后续按工厂订单处理时出现领域错误。
    building.ensureFactory();
    const now = new Date();
    const jobs = await deps.factoryProductionJobRepository.findByBuildingId(command.buildingId);

    // 查询订单时顺便做一次“到点即领取”的结算，把可领取产物入库并持久化订单状态。
    for (const job of jobs) {
      if (!job.canCollectAt(now)) {
        continue;
      }

      const outputs = job.collect(now);
      await receiveFactoryOutputs({
        inventoryRepository: deps.inventoryRepository,
        ownerUserId: command.ownerUserId,
        outputs,
      });
      await deps.factoryProductionJobRepository.save(job);
    }

    // 重新读取最新状态：前端只需要一个进行中订单作为焦点，其余都归类为历史订单。
    const refreshedJobs = await deps.factoryProductionJobRepository.findByBuildingId(command.buildingId);
    const inProgressJob = refreshedJobs.find((job) => job.status === "in_progress") ?? null;
    const historyJobs = refreshedJobs.filter((job) => job.status !== "in_progress");

    return {
      ok: true,
      focusOrder: inProgressJob ? toOrderDto(inProgressJob) : null,
      historyOrders: historyJobs.map(toOrderDto),
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
