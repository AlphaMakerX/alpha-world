import { and, asc, eq } from "drizzle-orm";
import { Plot, PlotCoordinate } from "@/server/features/plot/domain";
import type { PlotRepository } from "@/server/features/plot/domain";
import { db } from "@/server/lib/db";
import { plots } from "@/server/features/person/infrastructure/schema";

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

export class DrizzlePlotRepository implements PlotRepository {
  async findAll(): Promise<Plot[]> {
    const records = await db.query.plots.findMany({
      orderBy: asc(plots.id),
    });
    return records.map(toDomainPlot);
  }

  async findById(id: number): Promise<Plot | null> {
    const record = await db.query.plots.findFirst({
      where: eq(plots.id, id),
    });

    if (!record) {
      return null;
    }

    return toDomainPlot(record);
  }

  async findByCoordinate(coordinate: PlotCoordinate): Promise<Plot | null> {
    const record = await db.query.plots.findFirst({
      where: and(eq(plots.x, coordinate.getX()), eq(plots.y, coordinate.getY())),
    });

    if (!record) {
      return null;
    }

    return toDomainPlot(record);
  }

  async save(plot: Plot): Promise<void> {
    await db
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
