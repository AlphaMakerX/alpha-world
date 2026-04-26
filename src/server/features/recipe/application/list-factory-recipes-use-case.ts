/**
 * 查询工厂配方列表用例
 * 返回系统中所有可用的工厂生产配方。
 */

import { listRecipes } from "../domain/recipe-queries";

/** 执行查询工厂配方列表用例，返回所有配方数据 */
export async function executeListFactoryRecipesUseCase() {
  const recipes = listRecipes();
  return {
    recipes,
  };
}
