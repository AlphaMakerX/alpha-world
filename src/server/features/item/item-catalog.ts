/**
 * 物品目录（Item Catalog）
 * 定义游戏中所有物品的静态数据，包括物品标识、名称和阶级（tier）。
 * 提供按阶级筛选、按标识查询名称等工具函数。
 */

/** 物品阶级：基础材料 | 加工品 | 高级品 */
export type ItemTier = "base_material" | "processed_goods" | "advanced_goods";

/** 物品定义：描述单个物品的元数据 */
export type ItemDefinition = {
  key: string;
  name: string;
  tier: ItemTier;
};

/** 全量物品定义列表 */
const ITEM_DEFINITIONS: ItemDefinition[] = [
  { key: "wood", name: "木材", tier: "base_material" },
  { key: "iron_ore", name: "铁矿石", tier: "base_material" },
  { key: "cotton", name: "棉花", tier: "base_material" },
  { key: "coal", name: "煤炭", tier: "base_material" },
  { key: "water", name: "水资源", tier: "base_material" },
  { key: "stone", name: "石料", tier: "base_material" },
  { key: "wood_plank", name: "木板", tier: "processed_goods" },
  { key: "iron_ingot", name: "铁锭", tier: "processed_goods" },
  { key: "steel", name: "钢材", tier: "processed_goods" },
  { key: "cloth", name: "布料", tier: "processed_goods" },
  { key: "brick", name: "砖块", tier: "processed_goods" },
  { key: "paper", name: "纸张", tier: "processed_goods" },
  { key: "rope", name: "绳索", tier: "processed_goods" },
  { key: "furniture", name: "家具", tier: "advanced_goods" },
  { key: "tools", name: "工具组", tier: "advanced_goods" },
  { key: "machine_parts", name: "机器零件", tier: "advanced_goods" },
  { key: "sculpture", name: "雕塑", tier: "advanced_goods" },
  { key: "books", name: "书籍", tier: "advanced_goods" },
  { key: "reinforced_wall", name: "加固墙材", tier: "advanced_goods" },
  { key: "backpack", name: "背包", tier: "advanced_goods" },
  { key: "land_reclamation_badge", name: "开垦土地徽章", tier: "advanced_goods" },
];

/** 获取全部物品定义列表 */
export function listItemDefinitions(): ItemDefinition[] {
  return ITEM_DEFINITIONS;
}

/** 根据阶级筛选物品定义 */
export function listItemDefinitionsByTier(tier: ItemTier): ItemDefinition[] {
  return ITEM_DEFINITIONS.filter((item) => item.tier === tier);
}

/** 根据物品标识获取物品名称，未找到时返回标识本身 */
export function getItemName(itemKey: string): string {
  return ITEM_DEFINITIONS.find((item) => item.key === itemKey)?.name ?? itemKey;
}

/** 判断给定的物品标识是否在目录中 */
export function isKnownItemKey(itemKey: string): boolean {
  return ITEM_DEFINITIONS.some((item) => item.key === itemKey);
}
