import { and, asc, eq, inArray } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import { Building } from "@/server/features/building/domain";
import type { BuildingRepository, BuildingType, BuildingStatus } from "@/server/features/building/domain";
import type { FactorySubtype } from "@/server/features/factory/domain/factory-subtype";
import { buildings } from "@/server/features/building/infrastructure/schema";
import { plots } from "@/server/features/plot/infrastructure/schema";

/** 将数据库记录转换为建筑领域实体 */
function toDomainBuilding(record: typeof buildings.$inferSelect): Building {
  return Building.rehydrate({
    id: record.id,
    plotId: record.plotId,
    type: record.type as BuildingType,
    subtype: (record.subtype as FactorySubtype) ?? null,
    level: record.level,
    status: record.status as BuildingStatus,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

/** 基于 Drizzle ORM 的建筑仓储实现 */
export class DrizzleBuildingRepository implements BuildingRepository {
  async findById(id: number): Promise<Building | null> {
    const record = await getDbClient().query.buildings.findFirst({
      where: eq(buildings.id, id),
    });
    if (!record) {
      return null;
    }

    return toDomainBuilding(record);
  }

  async findByPlotId(plotId: number): Promise<Building | null> {
    const record = await getDbClient().query.buildings.findFirst({
      where: eq(buildings.plotId, plotId),
    });
    if (!record) {
      return null;
    }

    return toDomainBuilding(record);
  }

  async findByPlotIds(plotIds: number[]): Promise<Map<number, Building>> {
    if (plotIds.length === 0) {
      return new Map<number, Building>();
    }
    const records = await getDbClient().query.buildings.findMany({
      where: inArray(buildings.plotId, plotIds),
      orderBy: asc(buildings.id),
    });
    const buildingByPlotId = new Map<number, Building>();
    for (const record of records) {
      buildingByPlotId.set(record.plotId, toDomainBuilding(record));
    }
    return buildingByPlotId;
  }

  /** 通过关联地块表查询某用户名下的所有建筑 */
  async findByOwnerUserId(ownerUserId: string): Promise<Building[]> {
    const records = await getDbClient()
      .select({
        id: buildings.id,
        plotId: buildings.plotId,
        type: buildings.type,
        subtype: buildings.subtype,
        level: buildings.level,
        status: buildings.status,
        createdAt: buildings.createdAt,
        updatedAt: buildings.updatedAt,
      })
      .from(buildings)
      .innerJoin(plots, eq(plots.id, buildings.plotId))
      .where(and(eq(plots.ownerUserId, ownerUserId), eq(plots.status, "owned")))
      .orderBy(asc(buildings.id));
    return records.map((record) => toDomainBuilding(record));
  }

  /** 保存建筑：id > 0 时执行更新，否则执行插入 */
  async save(building: Building): Promise<Building> {
    if (building.id > 0) {
      const updated = await getDbClient()
        .update(buildings)
        .set({
          plotId: building.plotId,
          type: building.type,
          subtype: building.subtype,
          level: building.level,
          status: building.status,
          updatedAt: new Date(),
        })
        .where(eq(buildings.id, building.id))
        .returning();

      return toDomainBuilding(updated[0]);
    }

    const inserted = await getDbClient()
      .insert(buildings)
      .values({
        plotId: building.plotId,
        type: building.type,
        subtype: building.subtype,
        level: building.level,
        status: building.status,
        createdAt: building.createdAt,
        updatedAt: building.updatedAt,
      })
      .returning();
    return toDomainBuilding(inserted[0]);
  }
}

/** 建筑仓储单例，供依赖注入使用 */
export const buildingRepository: BuildingRepository = new DrizzleBuildingRepository();
