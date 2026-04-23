/**
 * 地块仓储的 Drizzle ORM 实现
 *
 * 提供地块实体的持久化操作，包括全量查询、按 ID/坐标查询和 upsert 保存。
 */
import { and, asc, eq } from "drizzle-orm";
import { Plot, PlotCoordinate } from "@/server/features/plot/domain";
import type { PlotRepository } from "@/server/features/plot/domain";
import { getDbClient } from "@/server/lib/db";
import { plots } from "@/server/features/plot/infrastructure/schema";

/** 将数据库记录转换为领域实体 Plot */
function toDomainPlot(record: typeof plots.$inferSelect): Plot {
  return Plot.rehydrate({
    id: record.id,
    coordinate: PlotCoordinate.create(record.x, record.y),
    ownerUserId: record.ownerUserId,
    status: record.status as "available" | "owned" | "locked",
    price: Number(record.price),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

/** 基于 Drizzle ORM 的地块仓储实现 */
export class DrizzlePlotRepository implements PlotRepository {
  async findAll(): Promise<Plot[]> {
    const records = await getDbClient().query.plots.findMany({
      orderBy: asc(plots.id),
    });
    return records.map(toDomainPlot);
  }

  async findById(id: number): Promise<Plot | null> {
    const record = await getDbClient().query.plots.findFirst({
      where: eq(plots.id, id),
    });

    if (!record) {
      return null;
    }

    return toDomainPlot(record);
  }

  async findByCoordinate(coordinate: PlotCoordinate): Promise<Plot | null> {
    const record = await getDbClient().query.plots.findFirst({
      where: and(eq(plots.x, coordinate.getX()), eq(plots.y, coordinate.getY())),
    });

    if (!record) {
      return null;
    }

    return toDomainPlot(record);
  }

  /** 保存地块（insert or update），使用 onConflictDoUpdate 实现 upsert */
  async save(plot: Plot): Promise<void> {
    await getDbClient()
      .insert(plots)
      .values({
        id: plot.id,
        x: plot.coordinate.getX(),
        y: plot.coordinate.getY(),
        ownerUserId: plot.ownerUserId,
        status: plot.status,
        price: plot.price.toString(),
        createdAt: plot.createdAt,
        updatedAt: plot.updatedAt,
      })
      .onConflictDoUpdate({
        target: plots.id,
        set: {
          ownerUserId: plot.ownerUserId,
          status: plot.status,
          price: plot.price.toString(),
          updatedAt: plot.updatedAt,
        },
      });
  }
}

export const plotRepository: PlotRepository = new DrizzlePlotRepository();
