import { useEffect, useMemo, useState } from "react";
import type { FactoryOrders, FactoryRecipe } from "@/client/features/factory/types/factory-ui";
import type { InventoryItem } from "@/client/features/building/types/building-ui";
import { FactoryOrdersSection } from "@/client/features/factory-orders/components/factory-orders-section";
import { RecipeDetail } from "@/client/features/factory/components/recipe-detail";
import { RecipeList } from "@/client/features/factory/components/recipe-list";

type RecipeCategory = FactoryRecipe["category"];
type RecipeFilter = "all" | RecipeCategory;

type FactorySectionProps = {
  factoryRecipes: FactoryRecipe[];
  factoryOrders?: FactoryOrders;
  inventoryItems: InventoryItem[];
  productionLoading: boolean;
  onStartProduction: (recipeId: string, quantity: number) => void;
};

export function FactorySection({
  factoryRecipes,
  factoryOrders,
  inventoryItems,
  productionLoading,
  onStartProduction,
}: FactorySectionProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RecipeFilter>("all");

  const filteredRecipes = useMemo(
    () =>
      selectedCategory === "all"
        ? factoryRecipes
        : factoryRecipes.filter((recipe) => recipe.category === selectedCategory),
    [factoryRecipes, selectedCategory],
  );

  const selectedRecipe = useMemo(
    () => filteredRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [filteredRecipes, selectedRecipeId],
  );

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
      {factoryRecipes.length ? (
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
