/**
 * 查询我的库存用例
 * 根据用户 ID 查询并返回该用户拥有的所有库存物品。
 */

import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";

/** 查询库存的命令参数 */
export type ListMyInventoryCommand = {
  ownerUserId: string;
};

/** 查询库存的成功返回结果 */
export type ListMyInventoryResult = {
  ok: true;
  items: ItemStack[];
};

/** 用例所需的外部依赖 */
export type ListMyInventoryUseCaseDeps = {
  inventoryRepository: InventoryRepository;
};

/** 执行查询我的库存用例，返回指定用户的全部库存物品 */
export async function executeListMyInventoryUseCase(
  command: ListMyInventoryCommand,
  deps: ListMyInventoryUseCaseDeps,
): Promise<ListMyInventoryResult> {
  const items = await deps.inventoryRepository.getByOwner(command.ownerUserId);
  return {
    ok: true,
    items,
  };
}
