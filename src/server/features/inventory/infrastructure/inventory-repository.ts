import { and, eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import type { InventoryRepository } from "@/server/features/inventory/domain";
import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";
import { createItemStack, normalizeItemKey } from "@/server/features/item/domain/value-objects/item-stack";
import { inventories } from "@/server/features/inventory/infrastructure/schema";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

export class DrizzleInventoryRepository implements InventoryRepository {
  async getByOwner(ownerUserId: string): Promise<ItemStack[]> {
    const rows = await getDbClient().query.inventories.findMany({
      where: eq(inventories.ownerUserId, ownerUserId),
    });
    return rows.filter((row) => row.quantity > 0).map((row) => createItemStack(row));
  }

  async getItemQuantity(ownerUserId: string, itemKey: string): Promise<number> {
    const normalizedItemKey = normalizeItemKey(itemKey);
    const row = await getDbClient().query.inventories.findFirst({
      where: and(
        eq(inventories.ownerUserId, ownerUserId),
        eq(inventories.itemKey, normalizedItemKey),
      ),
    });
    return row?.quantity ?? 0;
  }

  async addItem(ownerUserId: string, itemKey: string, quantity: number): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError("增加库存数量必须是正整数");
    }

    const normalizedItemKey = normalizeItemKey(itemKey);
    const currentQuantity = await this.getItemQuantity(ownerUserId, normalizedItemKey);
    const now = new Date();

    await getDbClient()
      .insert(inventories)
      .values({
        ownerUserId,
        itemKey: normalizedItemKey,
        quantity,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [inventories.ownerUserId, inventories.itemKey],
        set: {
          quantity: currentQuantity + quantity,
          updatedAt: now,
        },
      });
  }

  async consumeItem(ownerUserId: string, itemKey: string, quantity: number): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError("消耗库存数量必须是正整数");
    }

    const normalizedItemKey = normalizeItemKey(itemKey);
    const currentQuantity = await this.getItemQuantity(ownerUserId, normalizedItemKey);
    if (currentQuantity < quantity) {
      throw new DomainError(`库存不足: ${normalizedItemKey}`);
    }
    const now = new Date();

    await getDbClient()
      .insert(inventories)
      .values({
        ownerUserId,
        itemKey: normalizedItemKey,
        quantity: 0,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [inventories.ownerUserId, inventories.itemKey],
        set: {
          quantity: currentQuantity - quantity,
          updatedAt: now,
        },
      });
  }
}

export const inventoryRepository: InventoryRepository = new DrizzleInventoryRepository();
