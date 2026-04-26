/**
 * 基于 Drizzle ORM 的工厂仓储实现
 *
 * 与 BuildingRepository 共享 plot_buildings 表，
 * 只查询 type='factory' 的记录，映射为 Factory 领域实体。
 */
import { and, eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import { Factory } from "@/server/features/factory/domain/entities/factory";
import type { FactoryRepository } from "@/server/features/factory/domain/repositories/factory-repository";
import type { FactorySubtype } from "@/server/features/factory/domain/factory-subtype";
import { buildings } from "@/server/features/building/infrastructure/schema";

/** 将数据库记录转换为工厂领域实体 */
function toDomainFactory(record: typeof buildings.$inferSelect): Factory {
  return Factory.rehydrate({
    id: record.id,
    plotId: record.plotId,
    subtype: record.subtype as FactorySubtype,
    level: record.level,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

/** 基于 Drizzle ORM 的工厂仓储实现 */
export class DrizzleFactoryRepository implements FactoryRepository {
  async findByBuildingId(buildingId: number): Promise<Factory | null> {
    const record = await getDbClient().query.buildings.findFirst({
      where: and(eq(buildings.id, buildingId), eq(buildings.type, "factory")),
    });
    if (!record) {
      return null;
    }
    return toDomainFactory(record);
  }

  /** 保存工厂实体：仅更新 level 和 updatedAt */
  async save(factory: Factory): Promise<Factory> {
    const updated = await getDbClient()
      .update(buildings)
      .set({
        level: factory.level,
        updatedAt: new Date(),
      })
      .where(eq(buildings.id, factory.id))
      .returning();

    return toDomainFactory(updated[0]);
  }
}

/** 工厂仓储单例，供依赖注入使用 */
export const factoryRepository: FactoryRepository = new DrizzleFactoryRepository();
