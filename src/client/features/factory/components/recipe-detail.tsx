/**
 * 配方详情组件
 * 展示选中配方的详细信息，包括所需材料（带库存对比）、产出预览、制造数量输入和制造确认操作。
 */

import { useState, useEffect, useMemo } from "react";
import { Button, InputNumber, Popconfirm } from "antd";
import type { FactoryRecipe } from "@/client/features/factory/types/factory-ui";
import type { InventoryItem } from "@/client/features/building/types/building-ui";
import { ItemTile } from "@/client/features/item/components/item-tile";

/** 配方详情组件的 Props */
type RecipeDetailProps = {
  recipe: FactoryRecipe | null;
  inventoryItems: InventoryItem[];
  productionLoading: boolean;
  unlockLoading: boolean;
  onStartProduction: (recipeId: string, quantity: number) => void;
  onUnlockRecipe: (recipeId: string) => void;
};

/** 将秒数格式化为人类可读的时长字符串（如"5 分 30 秒"） */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m} 分 ${s} 秒` : `${m} 分`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h} 时 ${rm} 分` : `${h} 时`;
}

/** 配方详情组件，展示材料需求、产出预览并提供制造操作 */
export function RecipeDetail({ recipe, inventoryItems, productionLoading, unlockLoading, onStartProduction, onUnlockRecipe }: RecipeDetailProps) {
  const [quantity, setQuantity] = useState(1);
  // 将背包物品列表转为 Map，方便按 itemKey 快速查询数量
  const inventoryByItemKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventoryItems) {
      map.set(item.itemKey, item.quantity);
    }
    return map;
  }, [inventoryItems]);

  useEffect(() => {
    setQuantity(1);
  }, [recipe?.id]);

  if (!recipe) {
    return <p className="text-xs text-slate-500">请选择一个配方以查看材料并制造</p>;
  }

  // 未解锁的配方：显示解锁面板
  if (!recipe.unlocked) {
    return (
      <>
        <div className="rounded-md border border-amber-200 bg-amber-50/80 p-2">
          <p className="font-medium text-slate-800">{recipe.name}</p>
          <p className="text-xs text-amber-700">此配方尚未解锁</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-slate-600">解锁后可使用此配方进行生产。</p>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-amber-700">产出预览</p>
            {recipe.outputs.length ? (
              <div className="flex flex-wrap gap-2">
                {recipe.outputs.map((output) => (
                  <ItemTile
                    key={`${recipe.id}-out-${output.itemKey}`}
                    itemKey={output.itemKey}
                    quantity={output.quantity}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <p className="text-sm font-medium text-amber-800">解锁费用：{recipe.unlockCost} 金币</p>
        </div>
        <Popconfirm
          title={`确认花费 ${recipe.unlockCost} 金币解锁「${recipe.name}」吗？`}
          okText="确认解锁"
          cancelText="取消"
          onConfirm={() => onUnlockRecipe(recipe.id)}
          disabled={unlockLoading}
        >
          <Button type="primary" block loading={unlockLoading}>
            解锁配方（{recipe.unlockCost} 金币）
          </Button>
        </Popconfirm>
      </>
    );
  }

  const totalDuration = recipe.durationSeconds * quantity; // 总制造时长 = 单次时长 * 数量
  // 检查每种输入材料的库存是否充足（金币不检查库存）
  const inputChecks = recipe.inputs.map((input) => {
    const requiredQuantity = input.quantity * quantity;
    const ownedQuantity = inventoryByItemKey.get(input.itemKey) ?? 0;
    const isMoney = input.itemKey === "money";
    return {
      ...input,
      requiredQuantity,
      ownedQuantity,
      isMoney,
      isInsufficient: !isMoney && ownedQuantity < requiredQuantity,
    };
  });
  const hasInsufficientInputs = inputChecks.some((input) => input.isInsufficient);
  const canStartProduction = !productionLoading && !hasInsufficientInputs;

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
          max={100}
          value={quantity}
          onChange={(v) => {
            if (typeof v !== "number" || Number.isNaN(v)) {
              setQuantity(1);
              return;
            }
            setQuantity(Math.max(1, Math.min(100, Math.floor(v))));
          }}
          size="small"
          className="w-20"
          disabled={productionLoading}
        />
      </div>
      <p className="text-xs text-slate-500">制造数量不能超过 100</p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-amber-700">所需材料{quantity > 1 && ` (×${quantity})`}</p>
          {recipe.inputs.length ? (
            <div className="flex flex-wrap gap-2">
              {inputChecks.map((input) => (
                <ItemTile
                  key={`${recipe.id}-in-${input.itemKey}`}
                  itemKey={input.itemKey}
                  quantity={input.requiredQuantity}
                  ownedQuantity={input.isMoney ? undefined : input.ownedQuantity}
                  isInsufficient={input.isInsufficient}
                />
              ))}
              <ItemTile
                itemKey="stamina"
                quantity={Number((recipe.staminaCostPerUnit * quantity).toFixed(1))}
              />
            </div>
          ) : (
            <p className="text-xs text-slate-500">无</p>
          )}
          {hasInsufficientInputs ? <p className="text-xs text-red-600">材料不足，无法开始制造</p> : null}
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
        description={`将消耗 ${quantity} 倍材料 + 体力 ${(recipe.staminaCostPerUnit * quantity).toFixed(1)}，耗时 ${formatDuration(totalDuration)}。`}
        okText="确认制造"
        cancelText="取消"
        onConfirm={() => onStartProduction(recipe.id, quantity)}
        disabled={!canStartProduction}
      >
        <Button type="primary" block loading={productionLoading} disabled={!canStartProduction}>
          制造{quantity > 1 && ` ×${quantity}`}
        </Button>
      </Popconfirm>
    </>
  );
}
