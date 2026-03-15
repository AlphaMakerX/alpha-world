import { useState, useEffect } from "react";
import { Button, InputNumber, Popconfirm } from "antd";
import type { FactoryRecipe } from "@/client/features/building/types/building-ui";
import { ItemTile } from "@/client/features/inventory/components/item-tile";

type RecipeDetailProps = {
  recipe: FactoryRecipe | null;
  productionLoading: boolean;
  onStartProduction: (recipeId: string, quantity: number) => void;
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m} 分 ${s} 秒` : `${m} 分`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h} 时 ${rm} 分` : `${h} 时`;
}

export function RecipeDetail({ recipe, productionLoading, onStartProduction }: RecipeDetailProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [recipe?.id]);

  if (!recipe) {
    return <p className="text-xs text-slate-500">请选择一个配方以查看材料并制造</p>;
  }

  const totalDuration = recipe.durationSeconds * quantity;

  return (
    <>
      <div className="rounded-md border border-blue-200 bg-white/80 p-2">
        <p className="font-medium text-slate-800">{recipe.name}</p>
        <p className="text-xs text-slate-500">
          单次耗时 {recipe.durationSeconds} 秒
          {quantity > 1 && <span className="ml-1 text-blue-600">· 合计 {formatDuration(totalDuration)}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600">制造数量</span>
        <InputNumber
          min={1}
          max={99}
          value={quantity}
          onChange={(v) => setQuantity(v ?? 1)}
          size="small"
          className="w-20"
          disabled={productionLoading}
        />
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-amber-700">所需材料{quantity > 1 && ` (×${quantity})`}</p>
          {recipe.inputs.length ? (
            <div className="flex flex-wrap gap-2">
              {recipe.inputs.map((input) => (
                <ItemTile
                  key={`${recipe.id}-in-${input.itemKey}`}
                  itemKey={input.itemKey}
                  quantity={input.quantity * quantity}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">无</p>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-emerald-700">产出预览{quantity > 1 && ` (×${quantity})`}</p>
          {recipe.outputs.length ? (
            <div className="flex flex-wrap gap-2">
              {recipe.outputs.map((output) => (
                <ItemTile
                  key={`${recipe.id}-out-${output.itemKey}`}
                  itemKey={output.itemKey}
                  quantity={output.quantity * quantity}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">无</p>
          )}
        </div>
      </div>
      <Popconfirm
        title={`确认制造 ${quantity} 份「${recipe.name}」吗？`}
        description={`将消耗 ${quantity} 倍材料，耗时 ${formatDuration(totalDuration)}。`}
        okText="确认制造"
        cancelText="取消"
        onConfirm={() => onStartProduction(recipe.id, quantity)}
        disabled={productionLoading}
      >
        <Button type="primary" block loading={productionLoading} disabled={productionLoading}>
          制造{quantity > 1 && ` ×${quantity}`}
        </Button>
      </Popconfirm>
    </>
  );
}
