import { Button, Popconfirm } from "antd";
import type { FactoryRecipe } from "@/client/features/building/types/building-ui";
import { ItemTile } from "@/client/features/inventory/components/item-tile";

type RecipeDetailProps = {
  recipe: FactoryRecipe | null;
  productionLoading: boolean;
  onStartProduction: (recipeId: string) => void;
};

export function RecipeDetail({ recipe, productionLoading, onStartProduction }: RecipeDetailProps) {
  if (!recipe) {
    return <p className="text-xs text-slate-500">请选择一个配方以查看材料并制造</p>;
  }

  return (
    <>
      <div className="rounded-md border border-blue-200 bg-white/80 p-2">
        <p className="font-medium text-slate-800">{recipe.name}</p>
        <p className="text-xs text-slate-500">制造耗时 {recipe.durationSeconds} 秒</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-amber-700">所需材料</p>
          {recipe.inputs.length ? (
            <div className="flex flex-wrap gap-2">
              {recipe.inputs.map((input) => (
                <ItemTile key={`${recipe.id}-in-${input.itemKey}`} itemKey={input.itemKey} quantity={input.quantity} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">无</p>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-emerald-700">产出预览</p>
          {recipe.outputs.length ? (
            <div className="flex flex-wrap gap-2">
              {recipe.outputs.map((output) => (
                <ItemTile key={`${recipe.id}-out-${output.itemKey}`} itemKey={output.itemKey} quantity={output.quantity} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">无</p>
          )}
        </div>
      </div>
      <Popconfirm
        title={`确认制造「${recipe.name}」吗？`}
        description="确认后会立即生成制造订单并扣除对应材料。"
        okText="确认制造"
        cancelText="取消"
        onConfirm={() => onStartProduction(recipe.id)}
        disabled={productionLoading}
      >
        <Button type="primary" block loading={productionLoading} disabled={productionLoading}>
          制造
        </Button>
      </Popconfirm>
    </>
  );
}
