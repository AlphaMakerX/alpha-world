import type { Recipe } from "./value-objects/recipe";
import { assemblyRecipes } from "./data/assembly";
import { processingRecipes } from "./data/processing";
import { procurementRecipes } from "./data/procurement";

/** 全量配方列表 */
const ALL_RECIPES: Recipe[] = [
  ...procurementRecipes,
  ...processingRecipes,
  ...assemblyRecipes,
];

/** 获取全部配方（供 Application 层查询服务使用） */
export function getAllRecipes(): Recipe[] {
  return ALL_RECIPES;
}
