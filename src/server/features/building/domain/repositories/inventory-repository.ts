import type { ItemStack } from "@/server/features/building/domain/value-objects/item-stack";

export interface InventoryRepository {
  getByOwner(ownerUserId: string): Promise<ItemStack[]>;
  getItemQuantity(ownerUserId: string, itemKey: string): Promise<number>;
  addItem(ownerUserId: string, itemKey: string, quantity: number): Promise<void>;
  consumeItem(ownerUserId: string, itemKey: string, quantity: number): Promise<void>;
}
