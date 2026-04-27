/**
 * 查询工厂订单列表用例
 *
 * 查询指定工厂建筑的生产订单，同时自动结算已到期的订单（将产出物品入库）。
 * 返回一个"焦点订单"（当前进行中）和历史订单列表。
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import { receiveFactoryOutputs } from "@/server/features/inventory/application";
import type { FactoryProductionJobRepository } from "@/server/features/factory/domain";
import type { FactoryRepository } from "@/server/features/factory/domain/repositories/factory-repository";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";

/** 将生产任务实体转换为前端所需的 DTO 格式 */
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

/** 查询工厂订单的命令参数 */
export type ListFactoryOrdersCommand = {
  ownerUserId: string;
  buildingId: number;
};

/** 用例所需的外部依赖 */
export type ListFactoryOrdersUseCaseDeps = {
  factoryProductionJobRepository: FactoryProductionJobRepository;
  factoryRepository: FactoryRepository;
  buildingRepository: BuildingRepository;
  inventoryRepository: InventoryRepository;
  plotRepository: PlotRepository;
};

/** 查询成功的返回结果 */
type ListFactoryOrdersSuccessResult = {
  ok: true;
  focusOrder: ReturnType<typeof toOrderDto> | null;
  historyOrders: Array<ReturnType<typeof toOrderDto>>;
};

/** 查询失败的返回结果 */
type ListFactoryOrdersFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 用例返回类型（成功 | 失败） */
export type ListFactoryOrdersResult = ListFactoryOrdersSuccessResult | ListFactoryOrdersFailureResult;

/**
 * 执行查询工厂订单列表用例
 *
 * 流程：校验建筑与地块归属 -> 自动结算到期订单 -> 返回焦点订单和历史订单
 */
export async function executeListFactoryOrdersUseCase(
  command: ListFactoryOrdersCommand,
  deps: ListFactoryOrdersUseCaseDeps,
): Promise<ListFactoryOrdersResult> {
  const factory = await deps.factoryRepository.findByBuildingId(command.buildingId);
  if (!factory) {
    return {
      ok: false,
      error: "该建筑不是工厂",
      code: "NOT_FOUND",
    };
  }

  const plot = await deps.plotRepository.findById(factory.plotId);
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
