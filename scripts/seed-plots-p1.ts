import { db } from "@/server/lib/db";
import { executeSeedPlotsP1UseCase } from "@/server/features/system-initialization/composition";

const TOTAL_ROWS = 6;
const COLS_PER_ROW = 50;
const MIN_PRICE = 1000;
const MAX_PRICE = 3000;

async function seedP1Plots() {
  const result = await executeSeedPlotsP1UseCase({
    totalRows: TOTAL_ROWS,
    colsPerRow: COLS_PER_ROW,
    minPrice: MIN_PRICE,
    maxPrice: MAX_PRICE,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }
  console.log(
    `Seeded plots ${result.range.from} ~ ${result.range.to} (${result.seededCount} plots).`,
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
