import { and, eq } from "drizzle-orm";
import { db } from "@/server/lib/db";
import type { ShopListing, ShopListingRepository, ShopListingStatus } from "@/server/features/shop/domain";
import { shopListings } from "@/server/features/shop/infrastructure/schema";

function toShopListing(record: typeof shopListings.$inferSelect): ShopListing {
  return {
    id: record.id,
    buildingId: record.buildingId,
    sellerUserId: record.sellerUserId,
    itemKey: record.itemKey,
    quantity: record.quantity,
    unitPrice: Number(record.unitPrice),
    status: record.status as ShopListingStatus,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class DrizzleShopListingRepository implements ShopListingRepository {
  async create(input: Omit<ShopListing, "id" | "createdAt" | "updatedAt">): Promise<ShopListing> {
    const now = new Date();
    const inserted = await db
      .insert(shopListings)
      .values({
        buildingId: input.buildingId,
        sellerUserId: input.sellerUserId,
        itemKey: input.itemKey,
        quantity: input.quantity,
        unitPrice: input.unitPrice.toString(),
        status: input.status,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return toShopListing(inserted[0]);
  }

  async findById(id: number): Promise<ShopListing | null> {
    const record = await db.query.shopListings.findFirst({
      where: eq(shopListings.id, id),
    });
    return record ? toShopListing(record) : null;
  }

  async findActiveByBuildingId(buildingId: number): Promise<ShopListing[]> {
    const records = await db.query.shopListings.findMany({
      where: and(
        eq(shopListings.buildingId, buildingId),
        eq(shopListings.status, "active"),
      ),
    });
    return records.map(toShopListing);
  }

  async updateStatus(id: number, status: ShopListingStatus): Promise<void> {
    await db
      .update(shopListings)
      .set({ status, updatedAt: new Date() })
      .where(eq(shopListings.id, id));
  }

  async updateQuantity(id: number, quantity: number): Promise<void> {
    await db
      .update(shopListings)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(shopListings.id, id));
  }
}

export const shopListingRepository: ShopListingRepository = new DrizzleShopListingRepository();
