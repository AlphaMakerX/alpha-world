// domain 层：类型
export type { Recipe, RecipeCategory, FactorySubtype } from "./domain/value-objects/recipe";
// domain 层：原始数据
export { getAllRecipes } from "./domain/recipe-queries";

// application 层：查询服务
export {
  listRecipes,
  listRecipesByCategory,
  getRecipeById,
  listRecipesByFactorySubtype,
  listRecipesByFactorySubtypeAndLevel,
  listDefaultRecipes,
} from "./application/recipe-query-service";
