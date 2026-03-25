import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";

export async function receiveFactoryOutputs(input: {
  inventoryRepository: InventoryRepository;
  ownerUserId: string;
  outputs: ItemStack[];
}): Promise<void> {
  for (const outputItem of input.outputs) {
    await input.inventoryRepository.addItem(
      input.ownerUserId,
      outputItem.itemKey,
      outputItem.quantity,
    );
  }
}
