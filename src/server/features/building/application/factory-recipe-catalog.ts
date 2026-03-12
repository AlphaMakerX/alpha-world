import type { ItemStack } from "@/server/features/building/domain";

export type FactoryRecipe = {
  id: string;
  name: string;
  durationSeconds: number;
  inputs: ItemStack[];
  outputs: ItemStack[];
};

const recipes: FactoryRecipe[] = [
  {
    id: "buy_iron_ore",
    name: "采购铁矿石",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 120 }],
    outputs: [{ itemKey: "iron_ore", quantity: 6 }],
  },
  {
    id: "buy_wood",
    name: "采购木材",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 80 }],
    outputs: [{ itemKey: "wood", quantity: 8 }],
  },
  {
    id: "buy_cotton",
    name: "采购棉花",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 100 }],
    outputs: [{ itemKey: "cotton", quantity: 5 }],
  },
  {
    id: "buy_coal",
    name: "采购煤炭",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 60 }],
    outputs: [{ itemKey: "coal", quantity: 4 }],
  },
  {
    id: "buy_water",
    name: "采购水资源",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 40 }],
    outputs: [{ itemKey: "water", quantity: 6 }],
  },
  {
    id: "smelt_iron_ingot",
    name: "冶炼铁锭",
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
    durationSeconds: 45,
    inputs: [
      { itemKey: "money", quantity: 30 },
      { itemKey: "cotton", quantity: 2 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "cloth", quantity: 1 }],
  },
];

export function listFactoryRecipes(): FactoryRecipe[] {
  return recipes;
}

export function getFactoryRecipeById(recipeId: string): FactoryRecipe | null {
  return recipes.find((recipe) => recipe.id === recipeId) ?? null;
}
