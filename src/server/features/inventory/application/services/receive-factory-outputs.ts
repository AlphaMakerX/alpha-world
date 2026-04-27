/**
 * 接收工厂产出领域服务
 * 负责将工厂生产完成后的产出物品逐一添加到用户库存中。
 */

import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";

/**
 * 将工厂的产出物品写入用户库存
 * @param input.inventoryRepository - 库存仓储实例
 * @param input.ownerUserId - 物品所有者的用户 ID
 * @param input.outputs - 工厂产出的物品列表
 */
export async function receiveFactoryOutputs(input: {
  inventoryRepository: InventoryRepository;
  ownerUserId: string;
  outputs: ItemStack[];
}): Promise<void> {
  // 逐个将产出物品添加到用户库存
  for (const outputItem of input.outputs) {
    await input.inventoryRepository.addItem(
      input.ownerUserId,
      outputItem.itemKey,
      outputItem.quantity,
    );
  }
}
