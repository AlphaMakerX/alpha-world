/**
 * 库存仓储接口定义
 * 定义了库存领域的数据持久化抽象，供基础设施层实现。
 */

import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";
import type { ItemKey } from "@/server/features/item/item-catalog";

/** 库存仓储接口，提供对用户库存的增删查操作 */
export interface InventoryRepository {
  /** 根据用户 ID 获取该用户的所有库存物品 */
  getByOwner(ownerUserId: string): Promise<ItemStack[]>;
  /** 查询指定用户某个物品的库存数量 */
  getItemQuantity(ownerUserId: string, itemKey: ItemKey): Promise<number>;
  /** 向指定用户的库存中增加物品 */
  addItem(ownerUserId: string, itemKey: ItemKey, quantity: number): Promise<void>;
  /** 从指定用户的库存中消耗（扣减）物品 */
  consumeItem(ownerUserId: string, itemKey: ItemKey, quantity: number): Promise<void>;
}
