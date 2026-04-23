/**
 * 物品堆叠值对象（ItemStack）
 * 表示某种物品及其数量的组合，是库存、配方等模块的基础数据结构。
 */

import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

/** 物品堆叠：包含物品标识和数量 */
export type ItemStack = {
  itemKey: string;
  quantity: number;
};

/** 标准化物品标识：去除首尾空格并转为小写 */
export function normalizeItemKey(itemKey: string): string {
  return itemKey.trim().toLowerCase();
}

/**
 * 创建物品堆叠值对象
 * 对输入进行校验（标识非空、数量为正整数）并返回标准化后的 ItemStack
 */
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
