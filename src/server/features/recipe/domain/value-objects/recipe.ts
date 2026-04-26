import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";

/** 配方类别：采购 | 加工 | 组装 */
export type RecipeCategory = "procurement" | "processing" | "assembly";

/** 工厂子类型（与 building 模块共享定义） */
export type FactorySubtype =
  | "mine"
  | "lumber_mill"
  | "textile_mill"
  | "ranch"
  | "apothecary"
  | "waterworks"
  | "smelter"
  | "carpentry"
  | "paper_mill"
  | "assembler";

/** 配方定义：描述一个工厂生产配方的完整信息 */
export type Recipe = {
  id: string; // 配方唯一标识
  name: string; // 配方名称
  category: RecipeCategory; // 配方类别
  durationSeconds: number; // 生产耗时（秒）
  inputs: ItemStack[]; // 所需输入物品列表
  outputs: ItemStack[]; // 产出物品列表
  factorySubtypes: FactorySubtype[] | "*"; // 可用工厂类型，"*" 表示通用
  unlockCost: number; // 解锁费用（金币）
  requiredLevel: number; // 所需最低工厂等级
  defaultUnlocked: FactorySubtype[] | boolean; // true=全部自动解锁，数组=指定工厂自动解锁
};
