import { listDefaultRecipes } from "@/server/features/recipe/application/recipe-catalog";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";

/** 为新建工厂自动解锁默认配方 */
export async function autoUnlockDefaultRecipes(
  buildingId: number,
  subtype: string,
  unlockedRecipeRepository: UnlockedRecipeRepository,
): Promise<void> {
  const defaultRecipes = listDefaultRecipes(subtype);
  const recipeIds = defaultRecipes.map((r) => r.id);
  if (recipeIds.length > 0) {
    await unlockedRecipeRepository.saveBatch(buildingId, recipeIds);
  }
}
