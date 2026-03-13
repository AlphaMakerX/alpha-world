import { Button } from "antd";
import type { FactoryOrders, FactoryOrderStatus, FactoryRecipe } from "@/client/features/building/types/building-ui";
import type { Plot } from "@/client/features/plot/types/plot-ui";

type BuildingActionSectionProps = {
  building: Plot["building"];
  shouldShowFactoryRecipeList: boolean;
  factoryRecipes: FactoryRecipe[];
  factoryOrders?: FactoryOrders;
  productionLoading: boolean;
  onStartProduction: (recipeId: string) => void;
};

const factoryOrderStatusLabelByValue: Record<FactoryOrderStatus, string> = {
  in_progress: "进行中",
  collected: "已收取",
  cancelled: "已取消",
};

const formatDateTime = (value: Date | string | null) => {
  if (!value) {
    return "无";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "无";
  }
  return date.toLocaleString("zh-CN");
};

const formatItemStacks = (items: Array<{ itemKey: string; quantity: number }>) =>
  items.length ? items.map((item) => `${item.itemKey} x${item.quantity}`).join("，") : "无";

export function BuildingActionSection({
  building,
  shouldShowFactoryRecipeList,
  factoryRecipes,
  factoryOrders,
  productionLoading,
  onStartProduction,
}: BuildingActionSectionProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="font-medium text-slate-800">建筑操作</p>
      {shouldShowFactoryRecipeList ? (
        <div className="space-y-2">
          <p className="font-medium text-slate-800">工厂制造清单</p>
          {factoryRecipes.length ? (
            <div className="space-y-2">
              {factoryRecipes.map((recipe) => (
                <Button
                  key={recipe.id}
                  block
                  onClick={() => onStartProduction(recipe.id)}
                  loading={productionLoading}
                  disabled={productionLoading}
                >
                  {recipe.name}（{recipe.durationSeconds} 秒）
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">暂无可用配方</p>
          )}
          <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
            <p className="font-medium text-slate-800">重点订单</p>
            {factoryOrders?.focusOrder ? (
              <div className="space-y-1 text-xs text-slate-700">
                <p>订单 ID: {factoryOrders.focusOrder.id}</p>
                <p>配方: {factoryOrders.focusOrder.recipeId}</p>
                <p>状态: {factoryOrderStatusLabelByValue[factoryOrders.focusOrder.status]}</p>
                <p>开始时间: {formatDateTime(factoryOrders.focusOrder.startedAt)}</p>
                <p>完成时间: {formatDateTime(factoryOrders.focusOrder.finishAt)}</p>
                <p>投入: {formatItemStacks(factoryOrders.focusOrder.inputs)}</p>
                <p>产出: {formatItemStacks(factoryOrders.focusOrder.outputs)}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">当前没有进行中的重点订单</p>
            )}
          </div>
          <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
            <p className="font-medium text-slate-800">历史订单</p>
            {factoryOrders?.historyOrders.length ? (
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1 text-xs text-slate-700">
                {factoryOrders.historyOrders.map((order) => (
                  <div key={order.id} className="rounded border border-slate-200 p-2">
                    <p>订单 ID: {order.id}</p>
                    <p>配方: {order.recipeId}</p>
                    <p>状态: {factoryOrderStatusLabelByValue[order.status]}</p>
                    <p>开始时间: {formatDateTime(order.startedAt)}</p>
                    <p>完成时间: {formatDateTime(order.finishAt)}</p>
                    <p>收取时间: {formatDateTime(order.collectedAt)}</p>
                    <p>投入: {formatItemStacks(order.inputs)}</p>
                    <p>产出: {formatItemStacks(order.outputs)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">暂无历史订单</p>
            )}
          </div>
        </div>
      ) : building ? (
        <p className="text-slate-500">当前建筑暂无可用操作</p>
      ) : (
        <p className="text-slate-500">请先建造建筑后再执行建筑操作</p>
      )}
    </div>
  );
}
