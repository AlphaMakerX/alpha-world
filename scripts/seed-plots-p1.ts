import { db } from "@/server/lib/db";
import { plots } from "@/server/features/person/infrastructure/schema";
import { sql } from "drizzle-orm";

const START_PLOT_ID = "P1-01";
const END_PLOT_ID = "P1-10";
const BASE_PRICE = 1000;
const PRICE_STEP = 100;

function parsePlotId(plotId: string): { x: number; y: number } {
  const matched = /^P(\d+)-(\d+)$/.exec(plotId);
  if (!matched) {
    throw new Error(`Invalid plot id: ${plotId}`);
  }

  return {
    x: Number(matched[1]),
    y: Number(matched[2]),
  };
}

function formatPlotId(row: number, col: number): string {
  return `P${row}-${String(col).padStart(2, "0")}`;
}

async function seedP1Plots() {
  const start = parsePlotId(START_PLOT_ID);
  const end = parsePlotId(END_PLOT_ID);

  if (start.x !== end.x) {
    throw new Error("Start and end plot ids must be in the same row.");
  }
  if (start.y > end.y) {
    throw new Error("Start plot index must be less than or equal to end plot index.");
  }

  const row = start.x;
  const values: Array<typeof plots.$inferInsert> = [];

  for (let col = start.y; col <= end.y; col += 1) {
    const price = BASE_PRICE + (col - start.y) * PRICE_STEP;
    values.push({
      x: row,
      y: col,
      price: price.toFixed(2),
      status: "available",
      ownerUserId: null,
    });
  }

  await db
    .insert(plots)
    .values(values)
    .onConflictDoUpdate({
      target: [plots.x, plots.y],
      set: {
        price: sql`excluded.price`,
        updatedAt: sql`now()`,
      },
    });

  console.log(
    `Seeded plots ${formatPlotId(start.x, start.y)} ~ ${formatPlotId(end.x, end.y)} (${values.length} plots).`,
  );
}

seedP1Plots()
  .catch((error) => {
    console.error("Failed to seed P1 plots:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
