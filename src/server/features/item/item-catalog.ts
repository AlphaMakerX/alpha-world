/**
 * 物品目录（Item Catalog）
 * 定义游戏中所有物品的静态数据，包括物品标识、名称和阶级（tier）。
 * 提供按阶级筛选、按标识查询名称等工具函数。
 */

/** 物品阶级：原材料 | 加工件 | 精制品 | 成品 */
export type ItemTier =
  | "raw_material"
  | "component"
  | "refined_goods"
  | "end_product";

/** 物品定义：描述单个物品的元数据 */
export type ItemDefinition = {
  key: string;
  name: string;
  tier: ItemTier;
};

/** 全量物品定义列表 */
const ITEM_DEFINITIONS: ItemDefinition[] = [
  // ── 原材料 (raw_material) ── 直接采购获取的自然资源
  { key: "wood", name: "木材", tier: "raw_material" },
  { key: "iron_ore", name: "铁矿石", tier: "raw_material" },
  { key: "copper_ore", name: "铜矿石", tier: "raw_material" },
  { key: "coal", name: "煤炭", tier: "raw_material" },
  { key: "stone", name: "石料", tier: "raw_material" },
  { key: "sand", name: "沙子", tier: "raw_material" },
  { key: "clay", name: "粘土", tier: "raw_material" },
  { key: "cotton", name: "棉花", tier: "raw_material" },
  { key: "flax", name: "亚麻", tier: "raw_material" },
  { key: "raw_hide", name: "生皮", tier: "raw_material" },
  { key: "herbs", name: "草药", tier: "raw_material" },
  { key: "water", name: "水资源", tier: "raw_material" },
  { key: "animal_fat", name: "动物油脂", tier: "raw_material" },

  // ── 加工件 (component) ── 经过第一步加工后的中间件
  { key: "wood_plank", name: "木板", tier: "component" },
  { key: "charcoal", name: "木炭", tier: "component" },
  { key: "iron_ingot", name: "铁锭", tier: "component" },
  { key: "copper_ingot", name: "铜锭", tier: "component" },
  { key: "nails", name: "铁钉", tier: "component" },
  { key: "thread", name: "丝线", tier: "component" },
  { key: "cloth", name: "布料", tier: "component" },
  { key: "linen", name: "亚麻布", tier: "component" },
  { key: "rope", name: "绳索", tier: "component" },
  { key: "leather", name: "皮革", tier: "component" },
  { key: "dye", name: "染料", tier: "component" },
  { key: "brick", name: "砖块", tier: "component" },
  { key: "glass", name: "玻璃", tier: "component" },
  { key: "lime", name: "石灰", tier: "component" },
  { key: "paper", name: "纸张", tier: "component" },
  { key: "tallow", name: "油脂", tier: "component" },

  // ── 精制品 (refined_goods) ── 需要多种加工件组合的二次加工品
  { key: "steel", name: "钢材", tier: "refined_goods" },
  { key: "bronze", name: "青铜", tier: "refined_goods" },
  { key: "fine_cloth", name: "锦缎", tier: "refined_goods" },
  { key: "porcelain", name: "瓷器", tier: "refined_goods" },
  { key: "ink", name: "墨水", tier: "refined_goods" },
  { key: "plaster", name: "灰泥", tier: "refined_goods" },
  { key: "candle", name: "蜡烛", tier: "refined_goods" },
  { key: "pottery", name: "陶器", tier: "refined_goods" },

  // ── 成品 (end_product) ── 最终产品
  { key: "furniture", name: "家具", tier: "end_product" },
  { key: "tools", name: "工具组", tier: "end_product" },
  { key: "machine_parts", name: "机器零件", tier: "end_product" },
  { key: "barrel", name: "木桶", tier: "end_product" },
  { key: "window", name: "玻璃窗", tier: "end_product" },
  { key: "backpack", name: "背包", tier: "end_product" },
  { key: "armor", name: "铠甲", tier: "end_product" },
  { key: "saddle", name: "马鞍", tier: "end_product" },
  { key: "lantern", name: "灯笼", tier: "end_product" },
  { key: "compass", name: "指南针", tier: "end_product" },
  { key: "medicine", name: "药品", tier: "end_product" },
  { key: "books", name: "书籍", tier: "end_product" },
  { key: "reinforced_wall", name: "加固墙材", tier: "end_product" },
  { key: "sculpture", name: "雕塑", tier: "end_product" },
  { key: "telescope", name: "望远镜", tier: "end_product" },
  { key: "clock", name: "钟表", tier: "end_product" },
  { key: "land_reclamation_badge", name: "开垦土地徽章", tier: "end_product" },
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
