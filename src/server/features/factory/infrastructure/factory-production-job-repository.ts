/**
 * 工厂生产任务仓储的 Drizzle ORM 实现
 *
 * 基于 Drizzle ORM 实现 FactoryProductionJobRepository 接口，
 * 负责生产任务实体与数据库记录之间的映射和持久化操作。
 */
import { and, desc, eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import { FactoryProductionJob } from "@/server/features/factory/domain";
import type { FactoryProductionJobRepository } from "@/server/features/factory/domain";
import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";
import { factoryProductionJobs } from "@/server/features/factory/infrastructure/schema";

/** 将数据库中的 JSONB 字段解析为 ItemStack 数组，过滤无效条目 */
function toItemStacks(value: unknown): ItemStack[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const itemKey = "itemKey" in entry ? entry.itemKey : null;
      const quantity = "quantity" in entry ? entry.quantity : null;
      if (typeof itemKey !== "string" || !Number.isInteger(quantity) || quantity <= 0) {
        return null;
      }
      return { itemKey, quantity };
    })
    .filter((entry): entry is ItemStack => entry !== null);
}

/** 将数据库记录转换为生产任务领域实体 */
function toDomainJob(record: typeof factoryProductionJobs.$inferSelect): FactoryProductionJob {
  return FactoryProductionJob.rehydrate({
    id: record.id,
    buildingId: record.buildingId,
    ownerUserId: record.ownerUserId,
    recipeId: record.recipeId,
    inputs: toItemStacks(record.inputs),
    outputs: toItemStacks(record.outputs),
    status: record.status as "in_progress" | "collected" | "cancelled",
    startedAt: record.startedAt,
    finishAt: record.finishAt,
    collectedAt: record.collectedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

/** 基于 Drizzle ORM 的工厂生产任务仓储实现 */
export class DrizzleFactoryProductionJobRepository implements FactoryProductionJobRepository {
  async findById(id: number): Promise<FactoryProductionJob | null> {
    const record = await getDbClient().query.factoryProductionJobs.findFirst({
      where: eq(factoryProductionJobs.id, id),
    });
    if (!record) {
      return null;
    }

    return toDomainJob(record);
  }

  async findInProgressByBuildingId(buildingId: number): Promise<FactoryProductionJob | null> {
    const record = await getDbClient().query.factoryProductionJobs.findFirst({
      where: and(
        eq(factoryProductionJobs.buildingId, buildingId),
        eq(factoryProductionJobs.status, "in_progress"),
      ),
      orderBy: desc(factoryProductionJobs.id),
    });
    if (!record) {
      return null;
    }

    return toDomainJob(record);
  }

  async findByBuildingId(buildingId: number): Promise<FactoryProductionJob[]> {
    const records = await getDbClient().query.factoryProductionJobs.findMany({
      where: eq(factoryProductionJobs.buildingId, buildingId),
      orderBy: desc(factoryProductionJobs.id),
    });
    return records.map(toDomainJob);
  }

  /** 保存生产任务：id > 0 时执行更新（仅更新状态相关字段），否则执行插入 */
  async save(job: FactoryProductionJob): Promise<FactoryProductionJob> {
    if (job.id > 0) {
      const updated = await getDbClient()
        .update(factoryProductionJobs)
        .set({
          status: job.status,
          collectedAt: job.collectedAt,
          updatedAt: job.updatedAt,
        })
        .where(eq(factoryProductionJobs.id, job.id))
        .returning();
      return toDomainJob(updated[0]);
    }

    const inserted = await getDbClient()
      .insert(factoryProductionJobs)
      .values({
        buildingId: job.buildingId,
        ownerUserId: job.ownerUserId,
        recipeId: job.recipeId,
        inputs: job.inputs,
        outputs: job.outputs,
        status: job.status,
        startedAt: job.startedAt,
        finishAt: job.finishAt,
        collectedAt: job.collectedAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      })
      .returning();
    return toDomainJob(inserted[0]);
  }
}

/** 工厂生产任务仓储单例，供依赖注入使用 */
export const factoryProductionJobRepository: FactoryProductionJobRepository =
  new DrizzleFactoryProductionJobRepository();
