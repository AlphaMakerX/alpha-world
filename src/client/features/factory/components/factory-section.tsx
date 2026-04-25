/**
 * 工厂区组件
 * 工厂的主面板，包含配方分类筛选、配方列表、配方详情（含制造操作）和订单管理。
 */

import { Button, Popconfirm, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { FactoryOrders, FactoryRecipe, FactoryUpgradePreview } from "@/client/features/factory/types/factory-ui";
import type { InventoryItem } from "@/client/features/building/types/building-ui";
import { FactoryOrdersSection } from "@/client/features/factory-orders/components/factory-orders-section";
import { RecipeDetail } from "@/client/features/factory/components/recipe-detail";
import { RecipeList } from "@/client/features/factory/components/recipe-list";

type RecipeCategory = FactoryRecipe["category"];
type RecipeFilter = "all" | RecipeCategory;

/** 配方分类中文映射 */
const categoryLabel: Record<string, string> = {
  procurement: "采购",
  processing: "加工",
  assembly: "组装",
};

/** 工厂区组件的 Props */
type FactorySectionProps = {
  factoryRecipes: FactoryRecipe[];
  recipesLoading: boolean;
  factoryOrders?: FactoryOrders;
  inventoryItems: InventoryItem[];
  productionLoading: boolean;
  unlockLoading: boolean;
  upgradeLoading: boolean;
  upgradePreview: FactoryUpgradePreview;
  onStartProduction: (recipeId: string, quantity: number) => void;
  onUnlockRecipe: (recipeId: string) => void;
  onUpgradeFactory: () => void;
};

/** 工厂区组件，整合配方浏览、筛选、详情查看和订单管理功能 */
export function FactorySection({
  factoryRecipes,
  recipesLoading,
  factoryOrders,
  inventoryItems,
  productionLoading,
  unlockLoading,
  upgradeLoading,
  upgradePreview,
  onStartProduction,
  onUnlockRecipe,
  onUpgradeFactory,
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

  const [activeTab, setActiveTab] = useState<"produce" | "orders" | "upgrade">("produce");

  const tabs: Array<{ key: typeof activeTab; label: string; show: boolean }> = [
    { key: "produce", label: "制造", show: true },
    { key: "orders", label: "订单", show: true },
    { key: "upgrade", label: "升级", show: Boolean(upgradePreview) },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-1">
          {tabs.filter((t) => t.show).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "rounded px-3 py-1.5 text-xs font-medium transition",
                  isActive ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-500 hover:bg-slate-100",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "produce" ? (
        recipesLoading ? (
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
                unlockLoading={unlockLoading}
                onStartProduction={onStartProduction}
                onUnlockRecipe={onUnlockRecipe}
              />
            </div>
          </div>
        ) : (
          <p className="text-slate-500">暂无可用配方</p>
        )
      ) : null}

      {activeTab === "orders" ? (
        <FactoryOrdersSection factoryOrders={factoryOrders} />
      ) : null}

      {activeTab === "upgrade" && upgradePreview ? (
        <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
          <p className="text-sm text-slate-600">
            升级到 <span className="font-medium text-emerald-700">Lv.{upgradePreview.nextLevel}</span>，
            费用 <span className="font-medium text-amber-700">{upgradePreview.cost} 金币</span>
          </p>
          {upgradePreview.newRecipes.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">升级后解锁新配方：</p>
              <div className="flex flex-wrap gap-1.5">
                {upgradePreview.newRecipes.map((r) => (
                  <span
                    key={r.id}
                    className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs text-slate-700"
                  >
                    {r.name}
                    <span className="ml-1 text-slate-400">({categoryLabel[r.category] ?? r.category})</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">该等级无新增配方</p>
          )}
          <Popconfirm
            title={`确认花费 ${upgradePreview.cost} 金币升级到 Lv.${upgradePreview.nextLevel} 吗？`}
            okText="确认升级"
            cancelText="取消"
            onConfirm={onUpgradeFactory}
            disabled={upgradeLoading}
          >
            <Button type="primary" loading={upgradeLoading}>
              升级工厂（{upgradePreview.cost} 金币）
            </Button>
          </Popconfirm>
        </div>
      ) : null}
    </div>
  );
}
