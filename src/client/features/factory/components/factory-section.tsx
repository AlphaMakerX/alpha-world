import { useEffect, useMemo, useState } from "react";
import type { FactoryOrders, FactoryRecipe } from "@/client/features/factory/types/factory-ui";
import { FactoryOrdersSection } from "@/client/features/factory-orders/components/factory-orders-section";
import { RecipeDetail } from "@/client/features/factory/components/recipe-detail";
import { RecipeList } from "@/client/features/factory/components/recipe-list";

type FactorySectionProps = {
  factoryRecipes: FactoryRecipe[];
  factoryOrders?: FactoryOrders;
  productionLoading: boolean;
  onStartProduction: (recipeId: string, quantity: number) => void;
};

export function FactorySection({
  factoryRecipes,
  factoryOrders,
  productionLoading,
  onStartProduction,
}: FactorySectionProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const selectedRecipe = useMemo(
    () => factoryRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [factoryRecipes, selectedRecipeId],
  );

  useEffect(() => {
    if (!factoryRecipes.length) {
      setSelectedRecipeId(null);
      return;
    }
    if (!selectedRecipeId) {
      setSelectedRecipeId(factoryRecipes[0]?.id ?? null);
      return;
    }
    const exists = factoryRecipes.some((recipe) => recipe.id === selectedRecipeId);
    if (!exists) {
      setSelectedRecipeId(factoryRecipes[0]?.id ?? null);
    }
  }, [factoryRecipes, selectedRecipeId]);

  return (
    <div className="space-y-2">
      <p className="font-medium text-slate-800">工厂制造清单</p>
      {factoryRecipes.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <RecipeList
            recipes={factoryRecipes}
            selectedRecipeId={selectedRecipeId}
            disabled={productionLoading}
            onSelect={setSelectedRecipeId}
          />
          <div className="space-y-3 rounded-lg border border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-3">
            <RecipeDetail
              recipe={selectedRecipe}
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
