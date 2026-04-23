/**
 * 收购订单仓储的 Drizzle ORM 实现
 *
 * 基于 Drizzle ORM 实现 BuyOrderRepository 接口，
 * 提供收购订单的增删改查持久化操作。
 */

import { and, eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import type { BuyOrder, BuyOrderRepository, BuyOrderStatus } from "@/server/features/purchasing-station/domain";
import { buyOrders } from "@/server/features/purchasing-station/infrastructure/schema";

/** 将数据库记录转换为领域模型（注意 unitPrice 从 string 转为 number） */
function toBuyOrder(record: typeof buyOrders.$inferSelect): BuyOrder {
  return {
    id: record.id,
    buildingId: record.buildingId,
    buyerUserId: record.buyerUserId,
    itemKey: record.itemKey,
    quantity: record.quantity,
    unitPrice: Number(record.unitPrice),
    status: record.status as BuyOrderStatus,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** BuyOrderRepository 的 Drizzle ORM 实现 */
export class DrizzleBuyOrderRepository implements BuyOrderRepository {
  /** 插入一条新的收购订单并返回完整实体 */
  async create(input: Omit<BuyOrder, "id" | "createdAt" | "updatedAt">): Promise<BuyOrder> {
    const now = new Date();
    const inserted = await getDbClient()
      .insert(buyOrders)
      .values({
        buildingId: input.buildingId,
        buyerUserId: input.buyerUserId,
        itemKey: input.itemKey,
        quantity: input.quantity,
        unitPrice: input.unitPrice.toString(),
        status: input.status,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return toBuyOrder(inserted[0]);
  }

  async findById(id: number): Promise<BuyOrder | null> {
    const record = await getDbClient().query.buyOrders.findFirst({
      where: eq(buyOrders.id, id),
    });
    return record ? toBuyOrder(record) : null;
  }

  async findActiveByBuildingId(buildingId: number): Promise<BuyOrder[]> {
    const records = await getDbClient().query.buyOrders.findMany({
      where: and(
        eq(buyOrders.buildingId, buildingId),
        eq(buyOrders.status, "active"),
      ),
    });
    return records.map(toBuyOrder);
  }

  async updateStatus(id: number, status: BuyOrderStatus): Promise<void> {
    await getDbClient()
      .update(buyOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(buyOrders.id, id));
  }

  async updateQuantity(id: number, quantity: number): Promise<void> {
    await getDbClient()
      .update(buyOrders)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(buyOrders.id, id));
  }
}

/** 导出单例实例，供组合根注入使用 */
export const buyOrderRepository: BuyOrderRepository = new DrizzleBuyOrderRepository();
