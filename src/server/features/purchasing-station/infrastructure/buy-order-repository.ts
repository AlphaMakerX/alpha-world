import { and, eq } from "drizzle-orm";
import { db } from "@/server/lib/db";
import type { BuyOrder, BuyOrderRepository, BuyOrderStatus } from "@/server/features/purchasing-station/domain";
import { buyOrders } from "@/server/features/purchasing-station/infrastructure/schema";

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

export class DrizzleBuyOrderRepository implements BuyOrderRepository {
  async create(input: Omit<BuyOrder, "id" | "createdAt" | "updatedAt">): Promise<BuyOrder> {
    const now = new Date();
    const inserted = await db
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
    const record = await db.query.buyOrders.findFirst({
      where: eq(buyOrders.id, id),
    });
    return record ? toBuyOrder(record) : null;
  }

  async findActiveByBuildingId(buildingId: number): Promise<BuyOrder[]> {
    const records = await db.query.buyOrders.findMany({
      where: and(
        eq(buyOrders.buildingId, buildingId),
        eq(buyOrders.status, "active"),
      ),
    });
    return records.map(toBuyOrder);
  }

  async updateStatus(id: number, status: BuyOrderStatus): Promise<void> {
    await db
      .update(buyOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(buyOrders.id, id));
  }

  async updateQuantity(id: number, quantity: number): Promise<void> {
    await db
      .update(buyOrders)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(buyOrders.id, id));
  }
}

export const buyOrderRepository: BuyOrderRepository = new DrizzleBuyOrderRepository();
