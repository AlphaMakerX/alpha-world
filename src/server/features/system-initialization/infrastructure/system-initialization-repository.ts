import { and, eq, sql } from "drizzle-orm";
import { moneyTransactions } from "@/server/features/person/infrastructure/schema";
import { plots } from "@/server/features/plot/infrastructure/schema";
import { getDbClient } from "@/server/lib/db";

export class DrizzleSystemInitializationRepository {
  async hasMoneyTransfer(input: {
    fromUserId: string;
    toUserId: string;
    referenceId: string;
  }): Promise<boolean> {
    const existing = await getDbClient().query.moneyTransactions.findFirst({
      where: and(
        eq(moneyTransactions.fromUserId, input.fromUserId),
        eq(moneyTransactions.toUserId, input.toUserId),
        eq(moneyTransactions.referenceId, input.referenceId),
      ),
    });
    return Boolean(existing);
  }

  async upsertPlotsPriceIfUnowned(input: {
    totalRows: number;
    colsPerRow: number;
    minPrice: number;
    maxPrice: number;
  }): Promise<void> {
    const values: Array<typeof plots.$inferInsert> = [];
    for (let row = 1; row <= input.totalRows; row += 1) {
      for (let col = 1; col <= input.colsPerRow; col += 1) {
        const price =
          Math.floor(Math.random() * (input.maxPrice - input.minPrice + 1)) + input.minPrice;
        values.push({
          x: row,
          y: col,
          price: price.toFixed(2),
          status: "available",
          ownerUserId: null,
        });
      }
    }

    await getDbClient()
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
  }
}

export const systemInitializationRepository = new DrizzleSystemInitializationRepository();
