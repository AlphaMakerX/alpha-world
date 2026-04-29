/**
 * 商店上架商品仓储的 Drizzle ORM 实现
 *
 * 基于 Drizzle ORM 实现 ShopListingRepository 接口，
 * 提供商品上架记录的增删改查持久化操作。
 */

import { and, eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import type { ItemKey } from "@/server/features/item/item-catalog";
import type { ShopListing, ShopListingRepository, ShopListingStatus } from "@/server/features/shop/domain";
import { shopListings } from "@/server/features/shop/infrastructure/schema";

/** 将数据库记录转换为领域模型（注意 unitPrice 从 string 转为 number） */
function toShopListing(record: typeof shopListings.$inferSelect): ShopListing {
  return {
    id: record.id,
    buildingId: record.buildingId,
    sellerUserId: record.sellerUserId,
    itemKey: record.itemKey as ItemKey,
    quantity: record.quantity,
    unitPrice: Number(record.unitPrice),
    status: record.status as ShopListingStatus,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** ShopListingRepository 的 Drizzle ORM 实现 */
export class DrizzleShopListingRepository implements ShopListingRepository {
  /** 插入一条新的上架记录并返回完整实体 */
  async create(input: Omit<ShopListing, "id" | "createdAt" | "updatedAt">): Promise<ShopListing> {
    const now = new Date();
    const inserted = await getDbClient()
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
    const record = await getDbClient().query.shopListings.findFirst({
      where: eq(shopListings.id, id),
    });
    return record ? toShopListing(record) : null;
  }

  async findActiveByBuildingId(buildingId: number): Promise<ShopListing[]> {
    const records = await getDbClient().query.shopListings.findMany({
      where: and(
        eq(shopListings.buildingId, buildingId),
        eq(shopListings.status, "active"),
      ),
    });
    return records.map(toShopListing);
  }

  async updateStatus(id: number, status: ShopListingStatus): Promise<void> {
    await getDbClient()
      .update(shopListings)
      .set({ status, updatedAt: new Date() })
      .where(eq(shopListings.id, id));
  }

  async updateQuantity(id: number, quantity: number): Promise<void> {
    await getDbClient()
      .update(shopListings)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(shopListings.id, id));
  }
}

/** 导出单例实例，供组合根注入使用 */
export const shopListingRepository: ShopListingRepository = new DrizzleShopListingRepository();
