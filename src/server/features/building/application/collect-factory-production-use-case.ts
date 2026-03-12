import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { factoryProductionJobRepository, inventoryRepository } from "@/server/features/building/infrastructure";

const collectFactoryProductionSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  jobId: z.number().int().positive(),
});

type CollectFactoryProductionSuccessResult = {
  ok: true;
  job: {
    id: number;
    buildingId: number;
    ownerUserId: string;
    recipeId: string;
    status: "in_progress" | "collected" | "cancelled";
    startedAt: Date;
    finishAt: Date;
    collectedAt: Date | null;
  };
  outputs: Array<{ itemKey: string; quantity: number }>;
};

type CollectFactoryProductionFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type CollectFactoryProductionResult =
  | CollectFactoryProductionSuccessResult
  | CollectFactoryProductionFailureResult;

export async function executeCollectFactoryProductionUseCase(
  input: unknown,
): Promise<CollectFactoryProductionResult> {
  const parsed = collectFactoryProductionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const job = await factoryProductionJobRepository.findById(parsed.data.jobId);
  if (!job) {
    return {
      ok: false,
      error: "生产任务不存在",
      status: 404,
    };
  }

  try {
    job.ensureOwner(parsed.data.ownerUserId);
    const outputs = job.collect(new Date());
    for (const outputItem of outputs) {
      await inventoryRepository.addItem(
        parsed.data.ownerUserId,
        outputItem.itemKey,
        outputItem.quantity,
      );
    }
    const savedJob = await factoryProductionJobRepository.save(job);

    return {
      ok: true,
      job: {
        id: savedJob.id,
        buildingId: savedJob.buildingId,
        ownerUserId: savedJob.ownerUserId,
        recipeId: savedJob.recipeId,
        status: savedJob.status,
        startedAt: savedJob.startedAt,
        finishAt: savedJob.finishAt,
        collectedAt: savedJob.collectedAt,
      },
      outputs,
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        ok: false,
        error: error.message,
        status: 409,
      };
    }
    throw error;
  }
}
