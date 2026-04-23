/**
 * 工厂区组件
 * 工厂的主面板，包含配方分类筛选、配方列表、配方详情（含制造操作）和订单管理。
 */

import { Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { FactoryOrders, FactoryRecipe } from "@/client/features/factory/types/factory-ui";
import type { InventoryItem } from "@/client/features/building/types/building-ui";
import { FactoryOrdersSection } from "@/client/features/factory-orders/components/factory-orders-section";
import { RecipeDetail } from "@/client/features/factory/components/recipe-detail";
import { RecipeList } from "@/client/features/factory/components/recipe-list";

type RecipeCategory = FactoryRecipe["category"];
type RecipeFilter = "all" | RecipeCategory;

/** 工厂区组件的 Props */
type FactorySectionProps = {
  factoryRecipes: FactoryRecipe[];
  recipesLoading: boolean;
  factoryOrders?: FactoryOrders;
  inventoryItems: InventoryItem[];
  productionLoading: boolean;
  onStartProduction: (recipeId: string, quantity: number) => void;
};

/** 工厂区组件，整合配方浏览、筛选、详情查看和订单管理功能 */
export function FactorySection({
  factoryRecipes,
  recipesLoading,
  factoryOrders,
  inventoryItems,
  productionLoading,
  onStartProduction,
}: FactorySectionProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RecipeFilter>("all");

  // 根据选中分类筛选配方列表
  const filteredRecipes = useMemo(
    () =>
      selectedCategory === "all"
        ? factoryRecipes
        : factoryRecipes.filter((recipe) => recipe.category === selectedCategory),
    [factoryRecipes, selectedCategory],
  );

  // 从筛选后的列表中查找当前选中的配方
  const selectedRecipe = useMemo(
    () => filteredRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [filteredRecipes, selectedRecipeId],
  );

  // 配方列表变化时，重置分类和选中状态（如果当前分类已不存在）
  useEffect(() => {
    if (!factoryRecipes.length) {
      setSelectedCategory("all");
      setSelectedRecipeId(null);
      return;
    }
    if (selectedCategory !== "all" && !factoryRecipes.some((recipe) => recipe.category === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [factoryRecipes, selectedCategory]);

  // 筛选结果变化时，自动选中第一个配方（如果当前选中的已不在列表中）
  useEffect(() => {
    if (!filteredRecipes.length) {
      setSelectedRecipeId(null);
      return;
    }
    if (!selectedRecipeId) {
      setSelectedRecipeId(filteredRecipes[0]?.id ?? null);
      return;
    }
    const exists = filteredRecipes.some((recipe) => recipe.id === selectedRecipeId);
    if (!exists) {
      setSelectedRecipeId(filteredRecipes[0]?.id ?? null);
    }
  }, [filteredRecipes, selectedRecipeId]);

  return (
    <div className="space-y-2">
      <p className="font-medium text-slate-800">工厂制造清单</p>
      {recipesLoading ? (
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Spin size="small" />
            <span className="text-sm">配方加载中...</span>
          </div>
        </div>
      ) : factoryRecipes.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <RecipeList
            allRecipes={factoryRecipes}
            recipes={filteredRecipes}
            selectedRecipeId={selectedRecipeId}
            selectedCategory={selectedCategory}
            disabled={productionLoading}
            onSelectCategory={setSelectedCategory}
            onSelect={setSelectedRecipeId}
          />
          <div className="space-y-3 rounded-lg border border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-3">
            <RecipeDetail
              recipe={selectedRecipe}
              inventoryItems={inventoryItems}
              productionLoading={productionLoading}
              onStartProduction={onStartProduction}
            />
          </div>
        </div>
      ) : (
        <p className="text-slate-500">暂无可用配方</p>
      )}
      <FactoryOrdersSection factoryOrders={factoryOrders} />
    </div>
  );
}
