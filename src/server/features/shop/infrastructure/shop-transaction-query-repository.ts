/**
 * 商店交易查询仓储的 Drizzle ORM 实现
 *
 * 通过关联 shop_listings 和 money_transactions 表，
 * 查询指定商店建筑的购买交易记录（含买家用户名）。
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/lib/db";
import type { ShopTransactionQueryRepository, ShopTransactionRecord } from "@/server/features/shop/domain/repositories/shop-transaction-query-repository";
import { shopListings } from "@/server/features/shop/infrastructure/schema";
import { users } from "@/server/features/person/infrastructure/schema";
import { moneyTransactions } from "@/server/features/finance/infrastructure/schema";

/** ShopTransactionQueryRepository 的 Drizzle ORM 实现 */
class DrizzleShopTransactionQueryRepository
  implements ShopTransactionQueryRepository {
  async listByBuildingId(buildingId: number, limit: number): Promise<ShopTransactionRecord[]> {
    // 第一步：查出该建筑下的所有上架商品 ID
    const listings = await db.query.shopListings.findMany({
      where: eq(shopListings.buildingId, buildingId),
      columns: { id: true },
    });

    if (listings.length === 0) {
      return [];
    }

    // 第二步：根据上架商品 ID 关联查询交易记录，通过 fromUserId 关联买家用户名
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

/** 导出单例实例，供组合根注入使用 */
export const shopTransactionQueryRepository: ShopTransactionQueryRepository =
  new DrizzleShopTransactionQueryRepository();
