import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/lib/db";
import type { ShopTransactionQueryRepository, ShopTransactionRecord } from "@/server/features/shop/domain/repositories/shop-transaction-query-repository";
import { shopListings } from "@/server/features/shop/infrastructure/schema";
import { moneyTransactions, users } from "@/server/features/person/infrastructure/schema";

class DrizzleShopTransactionQueryRepository
  implements ShopTransactionQueryRepository {
  async listByBuildingId(buildingId: number, limit: number): Promise<ShopTransactionRecord[]> {
    const listings = await db.query.shopListings.findMany({
      where: eq(shopListings.buildingId, buildingId),
      columns: { id: true },
    });

    if (listings.length === 0) {
      return [];
    }

    const listingIds = listings.map((listing) => String(listing.id));
    const rows = await db
      .select({
        id: moneyTransactions.id,
        buyerUsername: users.username,
        amount: moneyTransactions.amount,
        description: moneyTransactions.description,
        createdAt: moneyTransactions.createdAt,
      })
      .from(moneyTransactions)
      .innerJoin(users, eq(moneyTransactions.fromUserId, users.id))
      .where(
        and(
          eq(moneyTransactions.type, "shop_purchase"),
          inArray(moneyTransactions.referenceId, listingIds),
        ),
      )
      .orderBy(desc(moneyTransactions.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      buyerUsername: row.buyerUsername,
      amount: Number(row.amount),
      description: row.description,
      createdAt: row.createdAt,
    }));
  }
}

export const shopTransactionQueryRepository: ShopTransactionQueryRepository =
  new DrizzleShopTransactionQueryRepository();
