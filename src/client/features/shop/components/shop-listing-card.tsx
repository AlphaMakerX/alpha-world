/**
 * 商店商品卡片组件
 *
 * 展示单个在售商品的信息（图标、名称、库存、单价）。
 * 根据当前用户是否为商店所有者显示不同操作：
 * - 所有者：显示总价和下架按钮
 * - 买家：显示购买数量选择和购买按钮
 */
import { useState } from "react";
import { Button, InputNumber, Popconfirm } from "antd";
import type { ShopListing } from "@/client/features/building/types/building-ui";
import { getItemDisplay } from "@/client/features/item/utils/item-display";

/** ShopListingCard 组件的 props 类型 */
type ShopListingCardProps = {
  listing: ShopListing;
  isOwner: boolean;
  purchaseLoading: boolean;
  cancelLoading: boolean;
  onPurchase: (listingId: number, quantity: number) => void;
  onCancel: (listingId: number) => void;
};

/** 商店在售商品卡片，所有者可下架，买家可选择数量购买 */
export function ShopListingCard({
  listing,
  isOwner,
  purchaseLoading,
  cancelLoading,
  onPurchase,
  onCancel,
}: ShopListingCardProps) {
  const display = getItemDisplay(listing.itemKey);
  const [purchaseQuantity, setPurchaseQuantity] = useState(listing.quantity);
  const subtotal = listing.unitPrice * purchaseQuantity;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:shadow-md">
      <div
        className={[
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg shadow-sm",
          display.iconClassName,
        ].join(" ")}
      >
        {display.icon}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-medium text-slate-800">{display.name}</p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>库存: {listing.quantity}</span>
          <span>单价: ¥{listing.unitPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {isOwner ? (
          <>
            <p className="text-sm font-bold text-amber-600">
              ¥{(listing.unitPrice * listing.quantity).toFixed(2)}
            </p>
            <div className="mt-1.5">
              <Popconfirm
                title="确认下架该商品？"
                description="下架后物品将退回你的背包。"
                okText="确认下架"
                cancelText="取消"
                onConfirm={() => onCancel(listing.id)}
                disabled={cancelLoading}
              >
                <Button size="small" danger loading={cancelLoading}>
                  下架
                </Button>
              </Popconfirm>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <InputNumber
              size="small"
              min={1}
              max={listing.quantity}
              value={purchaseQuantity}
              onChange={(v) => setPurchaseQuantity(v ?? 1)}
              className="w-16"
            />
            <Popconfirm
              title={`确认购买 ${display.name} ×${purchaseQuantity}？`}
              description={`总价 ¥${subtotal.toFixed(2)}，将从余额扣除。`}
              okText="确认购买"
              cancelText="取消"
              onConfirm={() => onPurchase(listing.id, purchaseQuantity)}
              disabled={purchaseLoading}
            >
              <Button type="primary" size="small" loading={purchaseLoading}>
                ¥{subtotal.toFixed(2)} 购买
              </Button>
            </Popconfirm>
          </div>
        )}
      </div>
    </div>
  );
}
