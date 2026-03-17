import { listFactoryRecipes } from "@/server/features/factory/application/factory-recipe-catalog";

export async function executeListFactoryRecipesUseCase() {
  const recipes = listFactoryRecipes();
  return {
    recipes,
  };
}
