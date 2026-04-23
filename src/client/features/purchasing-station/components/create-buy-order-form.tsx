/**
 * 创建收购订单表单组件
 *
 * 允许收购站所有者从物品目录中选择物品（按品阶分组），
 * 设置收购数量和单价后发布收购订单。发布时需预付总价。
 */
import { useState } from "react";
import { Button, InputNumber, Popconfirm, Spin } from "antd";
import { getItemDisplay } from "@/client/features/item/utils/item-display";
import { trpc } from "@/client/lib/trpc";

/** 物品品阶分组定义 */
const ITEM_TIERS = [
  { tier: "raw_material", label: "原材料" },
  { tier: "component", label: "加工件" },
  { tier: "refined_goods", label: "精制品" },
  { tier: "end_product", label: "成品" },
] as const;

/** CreateBuyOrderForm 组件的 props 类型 */
type CreateBuyOrderFormProps = {
  loading: boolean;
  onCreateOrder: (itemKey: string, quantity: number, unitPrice: number) => void;
};

/** 创建收购订单表单，从物品目录选择物品并设置价格后发布 */
export function CreateBuyOrderForm({
  loading,
  onCreateOrder,
}: CreateBuyOrderFormProps) {
  const { data: itemDefinitions, isLoading: itemCatalogLoading } =
    trpc.item.definitions.useQuery();

  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(1);

  // 按品阶分组可收购的物品
  const purchasableItemGroups = ITEM_TIERS.map(({ tier, label }) => ({
    label,
    itemKeys:
      itemDefinitions?.filter((item) => item.tier === tier).map((item) => item.key) ?? [],
  }));

  const hasAnyItem = purchasableItemGroups.some((group) => group.itemKeys.length > 0);
  const canSubmit = selectedItemKey && quantity > 0 && unitPrice > 0;
  const totalCost = unitPrice * quantity;

  /** 确认发布：调用回调并重置表单状态 */
  const handleConfirm = () => {
    if (!selectedItemKey || !canSubmit) return;
    onCreateOrder(selectedItemKey, quantity, unitPrice);
    setSelectedItemKey(null);
    setQuantity(1);
    setUnitPrice(1);
  };

  return (
    <div className="space-y-3 rounded-lg border border-violet-200 bg-gradient-to-b from-violet-50/60 to-white p-3">
      <p className="text-xs font-medium text-violet-700">发布收购订单</p>

      <div className="space-y-1.5">
        <label className="text-xs text-slate-600">选择收购物品</label>
        {itemCatalogLoading ? (
          <div className="flex justify-center rounded-md border border-dashed border-slate-200 py-6">
            <Spin size="small" />
          </div>
        ) : hasAnyItem ? (
          <div className="space-y-2">
            {purchasableItemGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="text-[11px] font-medium text-slate-500">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.itemKeys.map((itemKey) => {
                    const display = getItemDisplay(itemKey);
                    const isSelected = selectedItemKey === itemKey;
                    return (
                      <button
                        key={itemKey}
                        type="button"
                        onClick={() => {
                          setSelectedItemKey(itemKey);
                          setQuantity(1);
                        }}
                        disabled={loading || itemCatalogLoading}
                        className={[
                          "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition",
                          isSelected
                            ? "border-violet-400 bg-violet-50 font-medium text-violet-800 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        ].join(" ")}
                      >
                        <span>{display.icon}</span>
                        <span>{display.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
            暂无可收购物品
          </p>
        )}
      </div>

      {selectedItemKey ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-600">收购数量</label>
            <InputNumber
              min={1}
              value={quantity}
              onChange={(v) => setQuantity(v ?? 1)}
              disabled={loading}
              className="!w-full"
              size="small"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">单价 (¥)</label>
            <InputNumber
              min={0.01}
              step={0.01}
              value={unitPrice}
              onChange={(v) => setUnitPrice(v ?? 1)}
              disabled={loading}
              className="!w-full"
              size="small"
            />
          </div>
        </div>
      ) : null}

      {selectedItemKey && canSubmit ? (
        <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-600">
            预付总价: <span className="font-bold text-amber-600">¥{totalCost.toFixed(2)}</span>
          </p>
          <Popconfirm
            title="确认发布收购订单？"
            description={`将预付 ¥${totalCost.toFixed(2)} 收购 ${getItemDisplay(selectedItemKey).name} ×${quantity}`}
            okText="确认发布"
            cancelText="取消"
            onConfirm={handleConfirm}
            disabled={loading}
          >
            <Button type="primary" size="small" loading={loading} disabled={!canSubmit}>
              发布
            </Button>
          </Popconfirm>
        </div>
      ) : null}
    </div>
  );
}
