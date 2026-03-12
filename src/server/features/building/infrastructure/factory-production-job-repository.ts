import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { FactoryProductionJob } from "@/server/features/building/domain";
import type { FactoryProductionJobRepository, ItemStack } from "@/server/features/building/domain";
import { factoryProductionJobs } from "@/server/features/building/infrastructure/schema";

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

export class DrizzleFactoryProductionJobRepository implements FactoryProductionJobRepository {
  async findById(id: number): Promise<FactoryProductionJob | null> {
    const record = await db.query.factoryProductionJobs.findFirst({
      where: eq(factoryProductionJobs.id, id),
    });
    if (!record) {
      return null;
    }

    return toDomainJob(record);
  }

  async findInProgressByBuildingId(buildingId: number): Promise<FactoryProductionJob | null> {
    const record = await db.query.factoryProductionJobs.findFirst({
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
    const records = await db.query.factoryProductionJobs.findMany({
      where: eq(factoryProductionJobs.buildingId, buildingId),
      orderBy: desc(factoryProductionJobs.id),
    });
    return records.map(toDomainJob);
  }

  async save(job: FactoryProductionJob): Promise<FactoryProductionJob> {
    if (job.id > 0) {
      const updated = await db
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

    const inserted = await db
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

export const factoryProductionJobRepository: FactoryProductionJobRepository =
  new DrizzleFactoryProductionJobRepository();
