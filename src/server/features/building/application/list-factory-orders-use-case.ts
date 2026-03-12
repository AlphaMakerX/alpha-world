import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import {
  factoryProductionJobRepository,
  buildingRepository,
  inventoryRepository,
} from "@/server/features/building/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";

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

const listFactoryOrdersSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
});

export async function executeListFactoryOrdersUseCase(input: unknown) {
  const parsed = listFactoryOrdersSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400 as const,
    };
  }

  const building = await buildingRepository.findById(parsed.data.buildingId);
  if (!building) {
    return {
      ok: false as const,
      error: "建筑不存在",
      status: 404 as const,
    };
  }

  const plot = await plotRepository.findById(building.plotId);
  if (!plot) {
    return {
      ok: false as const,
      error: "地块不存在",
      status: 404 as const,
    };
  }
  if (plot.ownerUserId !== parsed.data.ownerUserId) {
    return {
      ok: false as const,
      error: "只能查看自己地块上的工厂订单",
      status: 409 as const,
    };
  }

  try {
    building.ensureFactory();
    const now = new Date();
    const jobs = await factoryProductionJobRepository.findByBuildingId(parsed.data.buildingId);

    for (const job of jobs) {
      if (job.status !== "in_progress") {
        continue;
      }
      if (job.finishAt.getTime() > now.getTime()) {
        continue;
      }

      const outputs = job.collect(now);
      for (const outputItem of outputs) {
        await inventoryRepository.addItem(
          parsed.data.ownerUserId,
          outputItem.itemKey,
          outputItem.quantity,
        );
      }
      await factoryProductionJobRepository.save(job);
    }

    const refreshedJobs = await factoryProductionJobRepository.findByBuildingId(parsed.data.buildingId);
    const inProgressJob = refreshedJobs.find((job) => job.status === "in_progress") ?? null;
    const historyJobs = refreshedJobs.filter((job) => job.status !== "in_progress");

    return {
      ok: true as const,
      focusOrder: inProgressJob ? toOrderDto(inProgressJob) : null,
      historyOrders: historyJobs.map(toOrderDto),
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        ok: false as const,
        error: error.message,
        status: 409 as const,
      };
    }
    throw error;
  }
}
