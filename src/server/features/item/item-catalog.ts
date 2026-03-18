export type ItemTier = "base_material" | "processed_goods" | "advanced_goods";

export type ItemDefinition = {
  key: string;
  name: string;
  tier: ItemTier;
};

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

export function listItemDefinitions(): ItemDefinition[] {
  return ITEM_DEFINITIONS;
}

export function listItemDefinitionsByTier(tier: ItemTier): ItemDefinition[] {
  return ITEM_DEFINITIONS.filter((item) => item.tier === tier);
}

export function isKnownItemKey(itemKey: string): boolean {
  return ITEM_DEFINITIONS.some((item) => item.key === itemKey);
}
