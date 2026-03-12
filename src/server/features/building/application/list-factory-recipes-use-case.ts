import { listFactoryRecipes } from "@/server/features/building/application/factory-recipe-catalog";

export async function executeListFactoryRecipesUseCase() {
  const recipes = listFactoryRecipes();
  return {
    recipes,
  };
}
