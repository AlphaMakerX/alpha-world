import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";

export type ListMyInventoryCommand = {
  ownerUserId: string;
};

export type ListMyInventoryResult = {
  ok: true;
  items: ItemStack[];
};

export type ListMyInventoryUseCaseDeps = {
  inventoryRepository: InventoryRepository;
};

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
