import type { FactoryRecipe } from "@/client/features/factory/types/factory-ui";

type RecipeListProps = {
  recipes: FactoryRecipe[];
  selectedRecipeId: string | null;
  disabled: boolean;
  onSelect: (recipeId: string) => void;
};

export function RecipeList({ recipes, selectedRecipeId, disabled, onSelect }: RecipeListProps) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
      <p className="px-1 text-xs font-medium tracking-wide text-slate-500">选择配方</p>
      {recipes.map((recipe) => {
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
      })}
    </div>
  );
}
