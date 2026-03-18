import type { FactoryRecipe } from "@/client/features/factory/types/factory-ui";

type RecipeCategory = FactoryRecipe["category"];
type RecipeFilter = "all" | RecipeCategory;

const CATEGORY_TABS: Array<{
  key: RecipeFilter;
  label: string;
}> = [
  { key: "all", label: "全部" },
  { key: "procurement", label: "采购" },
  { key: "processing", label: "加工" },
  { key: "assembly", label: "组装" },
];

type RecipeListProps = {
  allRecipes: FactoryRecipe[];
  recipes: FactoryRecipe[];
  selectedRecipeId: string | null;
  selectedCategory: RecipeFilter;
  disabled: boolean;
  onSelectCategory: (category: RecipeFilter) => void;
  onSelect: (recipeId: string) => void;
};

export function RecipeList({
  allRecipes,
  recipes,
  selectedRecipeId,
  selectedCategory,
  disabled,
  onSelectCategory,
  onSelect,
}: RecipeListProps) {
  const categoryCounts = allRecipes.reduce<Record<RecipeCategory, number>>(
    (acc, recipe) => {
      acc[recipe.category] += 1;
      return acc;
    },
    { procurement: 0, processing: 0, assembly: 0 },
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex gap-2">
        <div className="w-20 shrink-0 space-y-1 rounded-md border border-slate-200 bg-slate-50 p-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.key;
            const count =
              tab.key === "all" ? allRecipes.length : categoryCounts[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectCategory(tab.key)}
                className={[
                  "w-full rounded px-2 py-1.5 text-left text-xs transition",
                  isActive
                    ? "bg-blue-100 font-medium text-blue-700"
                    : "text-slate-600 hover:bg-white hover:text-slate-800",
                ].join(" ")}
                disabled={disabled}
              >
                <span className="flex items-center justify-between gap-1">
                  <span>{tab.label}</span>
                  <span className="text-[10px] text-slate-500">{count}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="px-1 text-xs font-medium tracking-wide text-slate-500">选择配方</p>
          {recipes.length ? (
            recipes.map((recipe) => {
              const isSelected = selectedRecipeId === recipe.id;
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => onSelect(recipe.id)}
                  className={[
                    "w-full rounded-md border px-3 py-2 text-left transition",
                    "hover:-translate-y-0.5 hover:border-slate-400",
                    isSelected
                      ? "border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:bg-white",
                  ].join(" ")}
                  disabled={disabled}
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
            })
          ) : (
            <p className="px-1 py-2 text-xs text-slate-500">该分类下暂无配方</p>
          )}
        </div>
      </div>
    </div>
  );
}
