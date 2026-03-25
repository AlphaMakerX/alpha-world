import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

export type ItemStack = {
  itemKey: string;
  quantity: number;
};

export function normalizeItemKey(itemKey: string): string {
  return itemKey.trim().toLowerCase();
}

export function createItemStack(input: ItemStack): ItemStack {
  const normalizedItemKey = normalizeItemKey(input.itemKey);
  if (!normalizedItemKey) {
    throw new DomainError("物品标识不能为空");
  }
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new DomainError("物品数量必须是正整数");
  }

  return {
    itemKey: normalizedItemKey,
    quantity: input.quantity,
  };
}
