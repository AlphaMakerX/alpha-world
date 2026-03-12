import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { Building } from "@/server/features/building/domain";
import type { BuildingRepository } from "@/server/features/building/domain";
import { buildings } from "@/server/features/building/infrastructure/schema";
import { plots } from "@/server/features/person/infrastructure/schema";

function toDomainBuilding(record: typeof buildings.$inferSelect): Building {
  return Building.rehydrate({
    id: record.id,
    plotId: record.plotId,
    type: record.type as "residential" | "factory" | "shop",
    status: record.status as "active",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export class DrizzleBuildingRepository implements BuildingRepository {
  async findById(id: number): Promise<Building | null> {
    const record = await db.query.buildings.findFirst({
      where: eq(buildings.id, id),
    });
    if (!record) {
      return null;
    }

    return toDomainBuilding(record);
  }

  async findByPlotId(plotId: number): Promise<Building | null> {
    const record = await db.query.buildings.findFirst({
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
    const records = await db.query.buildings.findMany({
      where: inArray(buildings.plotId, plotIds),
      orderBy: asc(buildings.id),
    });
    const buildingByPlotId = new Map<number, Building>();
    for (const record of records) {
      buildingByPlotId.set(record.plotId, toDomainBuilding(record));
    }
    return buildingByPlotId;
  }

  async findByOwnerUserId(ownerUserId: string): Promise<Building[]> {
    const records = await db
      .select({
        id: buildings.id,
        plotId: buildings.plotId,
        type: buildings.type,
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

  async save(building: Building): Promise<Building> {
    if (building.id > 0) {
      const updated = await db
        .update(buildings)
        .set({
          plotId: building.plotId,
          type: building.type,
          status: building.status,
          updatedAt: new Date(),
        })
        .where(eq(buildings.id, building.id))
        .returning();
      return toDomainBuilding(updated[0]);
    }

    const inserted = await db
      .insert(buildings)
      .values({
        plotId: building.plotId,
        type: building.type,
        status: building.status,
        createdAt: building.createdAt,
        updatedAt: building.updatedAt,
      })
      .returning();
    return toDomainBuilding(inserted[0]);
  }
}

export const buildingRepository: BuildingRepository = new DrizzleBuildingRepository();
