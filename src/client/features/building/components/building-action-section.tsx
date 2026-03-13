import { Button, Popconfirm } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { FactoryOrders, FactoryRecipe } from "@/client/features/building/types/building-ui";
import { FactoryOrdersSection } from "@/client/features/factory-orders/components/factory-orders-section";
import type { Plot } from "@/client/features/plot/types/plot-ui";

type BuildingActionSectionProps = {
  building: Plot["building"];
  shouldShowFactoryRecipeList: boolean;
  factoryRecipes: FactoryRecipe[];
  factoryOrders?: FactoryOrders;
  productionLoading: boolean;
  onStartProduction: (recipeId: string) => void;
};

export function BuildingActionSection({
  building,
  shouldShowFactoryRecipeList,
  factoryRecipes,
  factoryOrders,
  productionLoading,
  onStartProduction,
}: BuildingActionSectionProps) {
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
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="font-medium text-slate-800">建筑操作</p>
      {shouldShowFactoryRecipeList ? (
        <div className="space-y-2">
          <p className="font-medium text-slate-800">工厂制造清单</p>
          {factoryRecipes.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
                <p className="px-1 text-xs font-medium tracking-wide text-slate-500">选择配方</p>
                {factoryRecipes.map((recipe) => {
                  const isSelected = selectedRecipeId === recipe.id;
                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => setSelectedRecipeId(recipe.id)}
                      className={[
                        "w-full rounded-md border px-3 py-2 text-left transition",
                        "hover:-translate-y-0.5 hover:border-slate-400",
                        isSelected
                          ? "border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:bg-white",
                      ].join(" ")}
                      disabled={productionLoading}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-800">{recipe.name}</p>
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[11px]",
                            isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600",
                          ].join(" ")}
                        >
                          {recipe.durationSeconds}s
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3 rounded-lg border border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-3">
                {selectedRecipe ? (
                  <>
                    <div className="rounded-md border border-blue-200 bg-white/80 p-2">
                      <p className="font-medium text-slate-800">{selectedRecipe.name}</p>
                      <p className="text-xs text-slate-500">制造耗时 {selectedRecipe.durationSeconds} 秒</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="space-y-1 rounded-md border border-amber-100 bg-amber-50/70 p-2 text-xs text-slate-700">
                        <p className="font-medium text-amber-700">所需材料</p>
                        {selectedRecipe.inputs.length ? (
                          selectedRecipe.inputs.map((input) => (
                            <p key={`${selectedRecipe.id}-${input.itemKey}`}>
                              {input.itemKey} x{input.quantity}
                            </p>
                          ))
                        ) : (
                          <p>无</p>
                        )}
                      </div>
                      <div className="space-y-1 rounded-md border border-emerald-100 bg-emerald-50/70 p-2 text-xs text-slate-700">
                        <p className="font-medium text-emerald-700">产出预览</p>
                        {selectedRecipe.outputs.length ? (
                          selectedRecipe.outputs.map((output) => (
                            <p key={`${selectedRecipe.id}-${output.itemKey}`}>
                              {output.itemKey} x{output.quantity}
                            </p>
                          ))
                        ) : (
                          <p>无</p>
                        )}
                      </div>
                    </div>
                    <Popconfirm
                      title={`确认制造「${selectedRecipe.name}」吗？`}
                      description="确认后会立即生成制造订单并扣除对应材料。"
                      okText="确认制造"
                      cancelText="取消"
                      onConfirm={() => onStartProduction(selectedRecipe.id)}
                      disabled={productionLoading}
                    >
                      <Button type="primary" block loading={productionLoading} disabled={productionLoading}>
                        制造
                      </Button>
                    </Popconfirm>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">请选择一个配方以查看材料并制造</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500">暂无可用配方</p>
          )}
          <FactoryOrdersSection factoryOrders={factoryOrders} />
        </div>
      ) : building ? (
        <p className="text-slate-500">当前建筑暂无可用操作</p>
      ) : (
        <p className="text-slate-500">请先建造建筑后再执行建筑操作</p>
      )}
    </div>
  );
}
