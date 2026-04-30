/**
 * 住宅休息任务仓储的 Drizzle ORM 实现
 */
import { and, desc, eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import { RestJob } from "@/server/features/residential/domain/entities/rest-job";
import type { RestJobRepository } from "@/server/features/residential/domain/repositories/rest-job-repository";
import { residentialRestJobs } from "@/server/features/residential/infrastructure/schema";

/** 将数据库记录转换为休息任务领域实体 */
function toDomainJob(record: typeof residentialRestJobs.$inferSelect): RestJob {
  return RestJob.rehydrate({
    id: record.id,
    buildingId: record.buildingId,
    ownerUserId: record.ownerUserId,
    resterUserId: record.resterUserId,
    restType: record.restType,
    staminaGain: Number(record.staminaGain),
    cost: Number(record.cost),
    status: record.status as "in_progress" | "collected",
    startedAt: record.startedAt,
    finishAt: record.finishAt,
    collectedAt: record.collectedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

/** 基于 Drizzle ORM 的休息任务仓储实现 */
export class DrizzleRestJobRepository implements RestJobRepository {
  async findById(id: number): Promise<RestJob | null> {
    const record = await getDbClient().query.residentialRestJobs.findFirst({
      where: eq(residentialRestJobs.id, id),
    });
    if (!record) return null;
    return toDomainJob(record);
  }

  async findInProgressByBuildingId(buildingId: number): Promise<RestJob | null> {
    const record = await getDbClient().query.residentialRestJobs.findFirst({
      where: and(
        eq(residentialRestJobs.buildingId, buildingId),
        eq(residentialRestJobs.status, "in_progress"),
      ),
      orderBy: desc(residentialRestJobs.id),
    });
    if (!record) return null;
    return toDomainJob(record);
  }

  async findByBuildingId(buildingId: number): Promise<RestJob[]> {
    const records = await getDbClient().query.residentialRestJobs.findMany({
      where: eq(residentialRestJobs.buildingId, buildingId),
      orderBy: desc(residentialRestJobs.id),
    });
    return records.map(toDomainJob);
  }

  async save(job: RestJob): Promise<RestJob> {
    if (job.id > 0) {
      const updated = await getDbClient()
        .update(residentialRestJobs)
        .set({
          status: job.status,
          collectedAt: job.collectedAt,
          updatedAt: new Date(),
        })
        .where(eq(residentialRestJobs.id, job.id))
        .returning();
      return toDomainJob(updated[0]);
    }

    const inserted = await getDbClient()
      .insert(residentialRestJobs)
      .values({
        buildingId: job.buildingId,
        ownerUserId: job.ownerUserId,
        resterUserId: job.resterUserId,
        restType: job.restType,
        staminaGain: String(job.staminaGain),
        cost: String(job.cost),
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

/** 休息任务仓储单例，供依赖注入使用 */
export const restJobRepository: RestJobRepository = new DrizzleRestJobRepository();
