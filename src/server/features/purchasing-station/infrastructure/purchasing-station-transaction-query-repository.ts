import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/lib/db";
import type {
  PurchasingStationTransactionQueryRepository,
  PurchasingStationTransactionRecord,
} from "@/server/features/purchasing-station/domain/repositories/purchasing-station-transaction-query-repository";
import { buyOrders } from "@/server/features/purchasing-station/infrastructure/schema";
import { moneyTransactions, users } from "@/server/features/person/infrastructure/schema";

class DrizzlePurchasingStationTransactionQueryRepository
  implements PurchasingStationTransactionQueryRepository {
  async listByBuildingId(
    buildingId: number,
    limit: number,
  ): Promise<PurchasingStationTransactionRecord[]> {
    const orders = await db.query.buyOrders.findMany({
      where: eq(buyOrders.buildingId, buildingId),
      columns: { id: true },
    });

    if (orders.length === 0) {
      return [];
    }

    const orderIds = orders.map((order) => String(order.id));
    const rows = await db
      .select({
        id: moneyTransactions.id,
        sellerUsername: users.username,
        amount: moneyTransactions.amount,
        description: moneyTransactions.description,
        createdAt: moneyTransactions.createdAt,
      })
      .from(moneyTransactions)
      .innerJoin(users, eq(moneyTransactions.toUserId, users.id))
      .where(
        and(
          eq(moneyTransactions.type, "buy_order_fulfilled"),
          inArray(moneyTransactions.referenceId, orderIds),
        ),
      )
      .orderBy(desc(moneyTransactions.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      sellerUsername: row.sellerUsername,
      amount: Number(row.amount),
      description: row.description,
      createdAt: row.createdAt,
    }));
  }
}

export const purchasingStationTransactionQueryRepository: PurchasingStationTransactionQueryRepository =
  new DrizzlePurchasingStationTransactionQueryRepository();
