import type { FactorySubtype, Recipe } from "./value-objects/recipe";
import { assemblyRecipes } from "./data/assembly";
import { processingRecipes } from "./data/processing";
import { procurementRecipes } from "./data/procurement";

/** 全量配方列表 */
const ALL_RECIPES: Recipe[] = [
  ...procurementRecipes,
  ...processingRecipes,
  ...assemblyRecipes,
];

/** 获取全部配方列表 */
export function listRecipes(): Recipe[] {
  return ALL_RECIPES;
}

/** 根据类别筛选配方 */
export function listRecipesByCategory(category: string): Recipe[] {
  return ALL_RECIPES.filter((recipe) => recipe.category === category);
}

/** 根据配方 ID 查找配方，未找到时返回 null */
export function getRecipeById(recipeId: string): Recipe | null {
  return ALL_RECIPES.find((recipe) => recipe.id === recipeId) ?? null;
}

/** 按工厂子类型筛选可用配方（包含通用配方） */
export function listRecipesByFactorySubtype(subtype: string): Recipe[] {
  return ALL_RECIPES.filter((recipe) => {
    if (recipe.factorySubtypes === "*") return true;
    return recipe.factorySubtypes.includes(subtype as FactorySubtype);
  });
}

/** 按工厂子类型 + 等级筛选可用配方 */
export function listRecipesByFactorySubtypeAndLevel(subtype: string, level: number): Recipe[] {
  return ALL_RECIPES.filter((recipe) => {
    if (recipe.factorySubtypes !== "*" && !recipe.factorySubtypes.includes(subtype as FactorySubtype)) {
      return false;
    }
    return recipe.requiredLevel <= level;
  });
}

/** 获取某工厂类型建成后自动解锁的默认配方 */
export function listDefaultRecipes(subtype: string): Recipe[] {
  return ALL_RECIPES.filter((recipe) => {
    if (recipe.factorySubtypes !== "*" && !recipe.factorySubtypes.includes(subtype as FactorySubtype)) {
      return false;
    }
    if (recipe.defaultUnlocked === true) return true;
    if (recipe.defaultUnlocked === false) return false;
    return recipe.defaultUnlocked.includes(subtype as FactorySubtype);
  });
}
