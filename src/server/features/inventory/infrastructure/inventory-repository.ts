/**
 * 库存仓储的 Drizzle ORM 实现
 * 基于 PostgreSQL + Drizzle ORM 实现库存领域仓储接口，
 * 提供库存物品的查询、增加和消耗等持久化操作。
 */

import { and, eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import type { InventoryRepository } from "@/server/features/inventory/domain";
import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";
import { createItemStack, normalizeItemKey } from "@/server/features/item/domain/value-objects/item-stack";
import { inventories } from "@/server/features/inventory/infrastructure/schema";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

/** 使用 Drizzle ORM 实现的库存仓储 */
export class DrizzleInventoryRepository implements InventoryRepository {
  /** 获取指定用户的所有库存物品（过滤掉数量为 0 的记录） */
  async getByOwner(ownerUserId: string): Promise<ItemStack[]> {
    const rows = await getDbClient().query.inventories.findMany({
      where: eq(inventories.ownerUserId, ownerUserId),
    });
    // 过滤掉数量为 0 的记录，并将数据库行转换为领域值对象
    return rows.filter((row) => row.quantity > 0).map((row) => createItemStack(row));
  }

  /** 查询指定用户某个物品的当前库存数量 */
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

  /** 向指定用户的库存中增加物品，若记录已存在则累加数量（upsert） */
  async addItem(ownerUserId: string, itemKey: string, quantity: number): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError("增加库存数量必须是正整数");
    }

    const normalizedItemKey = normalizeItemKey(itemKey);
    // 先查询当前数量，用于冲突更新时计算新数量
    const currentQuantity = await this.getItemQuantity(ownerUserId, normalizedItemKey);
    const now = new Date();

    // 使用 upsert：不存在则插入，已存在则累加数量
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

  /** 从指定用户的库存中消耗物品，库存不足时抛出领域错误 */
  async consumeItem(ownerUserId: string, itemKey: string, quantity: number): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError("消耗库存数量必须是正整数");
    }

    const normalizedItemKey = normalizeItemKey(itemKey);
    const currentQuantity = await this.getItemQuantity(ownerUserId, normalizedItemKey);
    // 校验库存是否充足
    if (currentQuantity < quantity) {
      throw new DomainError(`库存不足: ${normalizedItemKey}`);
    }
    const now = new Date();

    // 使用 upsert：冲突时将数量减去消耗量
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

/** 导出库存仓储的单例实例 */
export const inventoryRepository: InventoryRepository = new DrizzleInventoryRepository();
