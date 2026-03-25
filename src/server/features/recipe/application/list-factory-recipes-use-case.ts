import { listRecipes } from "@/server/features/recipe/application/recipe-catalog";

export async function executeListFactoryRecipesUseCase() {
  const recipes = listRecipes();
  return {
    recipes,
  };
}
