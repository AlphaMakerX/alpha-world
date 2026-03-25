import { useState } from "react";
import { Button, InputNumber, Popconfirm } from "antd";
import type { InventoryItem } from "@/client/features/building/types/building-ui";
import { getItemDisplay } from "@/client/features/item/utils/item-display";

type ShopCreateListingFormProps = {
  inventoryItems: InventoryItem[];
  loading: boolean;
  onCreateListing: (itemKey: string, quantity: number, unitPrice: number) => void;
};

export function ShopCreateListingForm({
  inventoryItems,
  loading,
  onCreateListing,
}: ShopCreateListingFormProps) {
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  const availableItems = inventoryItems.filter((item) => item.quantity > 0);
  const selectedItem = availableItems.find((item) => item.itemKey === selectedItemKey);
  const maxQuantity = selectedItem?.quantity ?? 0;
  const canSubmit = selectedItemKey && quantity > 0 && quantity <= maxQuantity && unitPrice >= 0;

  const handleConfirm = () => {
    if (!selectedItemKey || !canSubmit) return;
    onCreateListing(selectedItemKey, quantity, unitPrice);
    setSelectedItemKey(null);
    setQuantity(1);
    setUnitPrice(0);
  };

  return (
    <div className="space-y-3 rounded-lg border border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white p-3">
      <p className="text-xs font-medium text-emerald-700">上架商品</p>

      {availableItems.length === 0 ? (
        <p className="text-xs text-slate-500">背包中暂无可上架的物品</p>
      ) : (
        <>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-600">选择物品</label>
            <div className="flex flex-wrap gap-1.5">
              {availableItems.map((item) => {
                const display = getItemDisplay(item.itemKey);
                const isSelected = selectedItemKey === item.itemKey;
                return (
                  <button
                    key={item.itemKey}
                    type="button"
                    onClick={() => {
                      setSelectedItemKey(item.itemKey);
                      setQuantity(1);
                    }}
                    disabled={loading}
                    className={[
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition",
                      isSelected
                        ? "border-emerald-400 bg-emerald-50 font-medium text-emerald-800 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    ].join(" ")}
                  >
                    <span>{display.icon}</span>
                    <span>{display.name}</span>
                    <span className="text-[10px] text-slate-400">×{item.quantity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedItemKey ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  上架数量 <span className="text-slate-400">(最多 {maxQuantity})</span>
                </label>
                <InputNumber
                  min={1}
                  max={maxQuantity}
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
                  min={0}
                  step={0.01}
                  value={unitPrice}
                  onChange={(v) => setUnitPrice(v ?? 0)}
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
                总价: <span className="font-bold text-amber-600">¥{(unitPrice * quantity).toFixed(2)}</span>
              </p>
              <Popconfirm
                title="确认上架商品？"
                description={`将上架 ${getItemDisplay(selectedItemKey).name} ×${quantity}，单价 ¥${unitPrice.toFixed(2)}`}
                okText="确认上架"
                cancelText="取消"
                onConfirm={handleConfirm}
                disabled={loading}
              >
                <Button type="primary" size="small" loading={loading} disabled={!canSubmit}>
                  上架
                </Button>
              </Popconfirm>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
