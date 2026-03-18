import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";

export type RecipeCategory = "procurement" | "processing" | "assembly";

export type Recipe = {
  id: string;
  name: string;
  category: RecipeCategory;
  durationSeconds: number;
  inputs: ItemStack[];
  outputs: ItemStack[];
};

const recipes: Recipe[] = [
  {
    id: "buy_iron_ore",
    name: "采购铁矿石",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 120 }],
    outputs: [{ itemKey: "iron_ore", quantity: 6 }],
  },
  {
    id: "buy_wood",
    name: "采购木材",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 80 }],
    outputs: [{ itemKey: "wood", quantity: 8 }],
  },
  {
    id: "buy_cotton",
    name: "采购棉花",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 100 }],
    outputs: [{ itemKey: "cotton", quantity: 5 }],
  },
  {
    id: "buy_coal",
    name: "采购煤炭",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 60 }],
    outputs: [{ itemKey: "coal", quantity: 4 }],
  },
  {
    id: "buy_water",
    name: "采购水资源",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 40 }],
    outputs: [{ itemKey: "water", quantity: 6 }],
  },
  {
    id: "buy_stone",
    name: "采购石料",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 70 }],
    outputs: [{ itemKey: "stone", quantity: 6 }],
  },
  {
    id: "smelt_iron_ingot",
    name: "冶炼铁锭",
    category: "processing",
    durationSeconds: 60,
    inputs: [
      { itemKey: "money", quantity: 40 },
      { itemKey: "iron_ore", quantity: 3 },
      { itemKey: "coal", quantity: 1 },
    ],
    outputs: [{ itemKey: "iron_ingot", quantity: 1 }],
  },
  {
    id: "saw_wood_plank",
    name: "木板加工",
    category: "processing",
    durationSeconds: 30,
    inputs: [
      { itemKey: "money", quantity: 20 },
      { itemKey: "wood", quantity: 2 },
    ],
    outputs: [{ itemKey: "wood_plank", quantity: 1 }],
  },
  {
    id: "woven_cloth",
    name: "纺织布料",
    category: "processing",
    durationSeconds: 45,
    inputs: [
      { itemKey: "money", quantity: 30 },
      { itemKey: "cotton", quantity: 2 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "cloth", quantity: 1 }],
  },
  {
    id: "forge_steel",
    name: "锻造钢材",
    category: "processing",
    durationSeconds: 70,
    inputs: [
      { itemKey: "money", quantity: 50 },
      { itemKey: "iron_ingot", quantity: 2 },
      { itemKey: "coal", quantity: 1 },
    ],
    outputs: [{ itemKey: "steel", quantity: 1 }],
  },
  {
    id: "kiln_brick",
    name: "烧制砖块",
    category: "processing",
    durationSeconds: 55,
    inputs: [
      { itemKey: "money", quantity: 25 },
      { itemKey: "stone", quantity: 2 },
      { itemKey: "water", quantity: 1 },
      { itemKey: "coal", quantity: 1 },
    ],
    outputs: [{ itemKey: "brick", quantity: 1 }],
  },
  {
    id: "pulp_paper",
    name: "造纸",
    category: "processing",
    durationSeconds: 40,
    inputs: [
      { itemKey: "money", quantity: 20 },
      { itemKey: "wood", quantity: 1 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "paper", quantity: 1 }],
  },
  {
    id: "twist_rope",
    name: "搓绳",
    category: "processing",
    durationSeconds: 35,
    inputs: [
      { itemKey: "money", quantity: 15 },
      { itemKey: "cotton", quantity: 2 },
    ],
    outputs: [{ itemKey: "rope", quantity: 1 }],
  },
  {
    id: "assemble_furniture",
    name: "组装家具",
    category: "assembly",
    durationSeconds: 120,
    inputs: [
      { itemKey: "money", quantity: 90 },
      { itemKey: "wood_plank", quantity: 3 },
      { itemKey: "cloth", quantity: 1 },
      { itemKey: "iron_ingot", quantity: 1 },
    ],
    outputs: [{ itemKey: "furniture", quantity: 1 }],
  },
  {
    id: "forge_tools",
    name: "打造工具组",
    category: "assembly",
    durationSeconds: 110,
    inputs: [
      { itemKey: "money", quantity: 80 },
      { itemKey: "steel", quantity: 1 },
      { itemKey: "wood_plank", quantity: 1 },
    ],
    outputs: [{ itemKey: "tools", quantity: 1 }],
  },
  {
    id: "assemble_machine_parts",
    name: "装配机器零件",
    category: "assembly",
    durationSeconds: 140,
    inputs: [
      { itemKey: "money", quantity: 120 },
      { itemKey: "steel", quantity: 2 },
      { itemKey: "iron_ingot", quantity: 1 },
    ],
    outputs: [{ itemKey: "machine_parts", quantity: 1 }],
  },
  {
    id: "carve_sculpture",
    name: "雕刻雕塑",
    category: "assembly",
    durationSeconds: 130,
    inputs: [
      { itemKey: "money", quantity: 95 },
      { itemKey: "stone", quantity: 3 },
      { itemKey: "tools", quantity: 1 },
    ],
    outputs: [{ itemKey: "sculpture", quantity: 1 }],
  },
  {
    id: "bind_books",
    name: "装订书籍",
    category: "assembly",
    durationSeconds: 90,
    inputs: [
      { itemKey: "money", quantity: 70 },
      { itemKey: "paper", quantity: 3 },
      { itemKey: "cloth", quantity: 1 },
    ],
    outputs: [{ itemKey: "books", quantity: 1 }],
  },
  {
    id: "build_reinforced_wall",
    name: "制作加固墙材",
    category: "assembly",
    durationSeconds: 150,
    inputs: [
      { itemKey: "money", quantity: 130 },
      { itemKey: "brick", quantity: 2 },
      { itemKey: "steel", quantity: 1 },
    ],
    outputs: [{ itemKey: "reinforced_wall", quantity: 1 }],
  },
  {
    id: "craft_backpack",
    name: "缝制背包",
    category: "assembly",
    durationSeconds: 100,
    inputs: [
      { itemKey: "money", quantity: 85 },
      { itemKey: "cloth", quantity: 1 },
      { itemKey: "rope", quantity: 1 },
      { itemKey: "wood_plank", quantity: 1 },
    ],
    outputs: [{ itemKey: "backpack", quantity: 1 }],
  },
  {
    id: "craft_land_reclamation_badge",
    name: "铸造开垦土地徽章",
    category: "assembly",
    durationSeconds: 480,
    inputs: [
      { itemKey: "money", quantity: 1200 },
      { itemKey: "wood_plank", quantity: 20 },
      { itemKey: "iron_ingot", quantity: 16 },
      { itemKey: "steel", quantity: 10 },
      { itemKey: "brick", quantity: 18 },
      { itemKey: "cloth", quantity: 12 },
      { itemKey: "rope", quantity: 10 },
      { itemKey: "paper", quantity: 10 },
      { itemKey: "tools", quantity: 4 },
      { itemKey: "machine_parts", quantity: 3 },
      { itemKey: "reinforced_wall", quantity: 2 },
      { itemKey: "books", quantity: 2 },
      { itemKey: "backpack", quantity: 2 },
      { itemKey: "furniture", quantity: 1 },
      { itemKey: "sculpture", quantity: 1 },
    ],
    outputs: [{ itemKey: "land_reclamation_badge", quantity: 1 }],
  },
];

export function listRecipes(): Recipe[] {
  return recipes;
}

export function listRecipesByCategory(category: RecipeCategory): Recipe[] {
  return recipes.filter((recipe) => recipe.category === category);
}

export function getRecipeById(recipeId: string): Recipe | null {
  return recipes.find((recipe) => recipe.id === recipeId) ?? null;
}
