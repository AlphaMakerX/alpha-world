/**
 * 收购站交易查询仓储的 Drizzle ORM 实现
 *
 * 通过关联 buy_orders 和 money_transactions 表，
 * 查询指定收购站建筑的成交交易记录（含卖家用户名）。
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/lib/db";
import type {
  PurchasingStationTransactionQueryRepository,
  PurchasingStationTransactionRecord,
} from "@/server/features/purchasing-station/domain/repositories/purchasing-station-transaction-query-repository";
import { buyOrders } from "@/server/features/purchasing-station/infrastructure/schema";
import { moneyTransactions, users } from "@/server/features/person/infrastructure/schema";

/** PurchasingStationTransactionQueryRepository 的 Drizzle ORM 实现 */
class DrizzlePurchasingStationTransactionQueryRepository
  implements PurchasingStationTransactionQueryRepository {
  async listByBuildingId(
    buildingId: number,
    limit: number,
  ): Promise<PurchasingStationTransactionRecord[]> {
    // 第一步：查出该建筑下的所有收购订单 ID
    const orders = await db.query.buyOrders.findMany({
      where: eq(buyOrders.buildingId, buildingId),
      columns: { id: true },
    });

    if (orders.length === 0) {
      return [];
    }

    // 第二步：根据收购订单 ID 关联查询交易记录，通过 toUserId 关联卖家用户名
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

/** 导出单例实例，供组合根注入使用 */
export const purchasingStationTransactionQueryRepository: PurchasingStationTransactionQueryRepository =
  new DrizzlePurchasingStationTransactionQueryRepository();
