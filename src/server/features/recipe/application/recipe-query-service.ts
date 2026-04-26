/**
 * 配方查询服务（Application 层）
 * 提供按 ID、类别、工厂子类型、等级等维度的配方查询能力。
 */

import type { FactorySubtype, Recipe } from "../domain/value-objects/recipe";
import { getAllRecipes } from "../domain/recipe-queries";

/** 获取全部配方列表 */
export function listRecipes(): Recipe[] {
  return getAllRecipes();
}

/** 根据类别筛选配方 */
export function listRecipesByCategory(category: string): Recipe[] {
  return getAllRecipes().filter((recipe) => recipe.category === category);
}

/** 根据配方 ID 查找配方，未找到时返回 null */
export function getRecipeById(recipeId: string): Recipe | null {
  return getAllRecipes().find((recipe) => recipe.id === recipeId) ?? null;
}

/** 按工厂子类型筛选可用配方（包含通用配方） */
export function listRecipesByFactorySubtype(subtype: string): Recipe[] {
  return getAllRecipes().filter((recipe) => {
    if (recipe.factorySubtypes === "*") return true;
    return recipe.factorySubtypes.includes(subtype as FactorySubtype);
  });
}

/** 按工厂子类型 + 等级筛选可用配方 */
export function listRecipesByFactorySubtypeAndLevel(subtype: string, level: number): Recipe[] {
  return getAllRecipes().filter((recipe) => {
    if (recipe.factorySubtypes !== "*" && !recipe.factorySubtypes.includes(subtype as FactorySubtype)) {
      return false;
    }
    return recipe.requiredLevel <= level;
  });
}

/** 获取某工厂类型建成后自动解锁的默认配方 */
export function listDefaultRecipes(subtype: string): Recipe[] {
  return getAllRecipes().filter((recipe) => {
    if (recipe.factorySubtypes !== "*" && !recipe.factorySubtypes.includes(subtype as FactorySubtype)) {
      return false;
    }
    if (recipe.defaultUnlocked === true) return true;
    if (recipe.defaultUnlocked === false) return false;
    return recipe.defaultUnlocked.includes(subtype as FactorySubtype);
  });
}
