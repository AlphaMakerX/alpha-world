import { db } from "@/server/lib/db";
import type { ShopListing, ShopListingRepository } from "@/server/features/building/domain";
import { shopListings } from "@/server/features/building/infrastructure/schema";

function toShopListing(record: typeof shopListings.$inferSelect): ShopListing {
  return {
    id: record.id,
    buildingId: record.buildingId,
    sellerUserId: record.sellerUserId,
    itemKey: record.itemKey,
    quantity: record.quantity,
    unitPrice: Number(record.unitPrice),
    status: record.status as "active" | "sold" | "cancelled",
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
}

export const shopListingRepository: ShopListingRepository = new DrizzleShopListingRepository();
