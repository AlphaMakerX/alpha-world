import { db } from "@/server/lib/db";
import { plots } from "@/server/features/person/infrastructure/schema";
import { sql } from "drizzle-orm";

const TOTAL_ROWS = 6;
const COLS_PER_ROW = 50;
const MIN_PRICE = 1000;
const MAX_PRICE = 3000;

function formatPlotId(row: number, col: number): string {
  return `P${row}-${String(col).padStart(2, "0")}`;
}

async function seedP1Plots() {
  const values: Array<typeof plots.$inferInsert> = [];

  for (let row = 1; row <= TOTAL_ROWS; row += 1) {
    for (let col = 1; col <= COLS_PER_ROW; col += 1) {
      const price = Math.floor(Math.random() * (MAX_PRICE - MIN_PRICE + 1)) + MIN_PRICE;
      values.push({
        x: row,
        y: col,
        price: price.toFixed(2),
        status: "available",
        ownerUserId: null,
      });
    }
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
      setWhere: sql`${plots.ownerUserId} IS NULL`,
    });

  console.log(
    `Seeded plots ${formatPlotId(1, 1)} ~ ${formatPlotId(TOTAL_ROWS, COLS_PER_ROW)} (${values.length} plots).`,
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
