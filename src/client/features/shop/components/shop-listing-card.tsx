import { Button, Popconfirm } from "antd";
import type { ShopListing } from "@/client/features/building/types/building-ui";
import { getItemDisplay } from "@/client/features/inventory/utils/item-display";

type ShopListingCardProps = {
  listing: ShopListing;
  isOwner: boolean;
  purchaseLoading: boolean;
  cancelLoading: boolean;
  onPurchase: (listingId: number) => void;
  onCancel: (listingId: number) => void;
};

export function ShopListingCard({
  listing,
  isOwner,
  purchaseLoading,
  cancelLoading,
  onPurchase,
  onCancel,
}: ShopListingCardProps) {
  const display = getItemDisplay(listing.itemKey);
  const totalPrice = listing.unitPrice * listing.quantity;

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
          <span>数量: {listing.quantity}</span>
          <span>单价: ¥{listing.unitPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-amber-600">¥{totalPrice.toFixed(2)}</p>
        <div className="mt-1.5">
          {isOwner ? (
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
          ) : (
            <Popconfirm
              title={`确认购买 ${display.name} ×${listing.quantity}？`}
              description={`总价 ¥${totalPrice.toFixed(2)}，将从余额扣除。`}
              okText="确认购买"
              cancelText="取消"
              onConfirm={() => onPurchase(listing.id)}
              disabled={purchaseLoading}
            >
              <Button type="primary" size="small" loading={purchaseLoading}>
                购买
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>
    </div>
  );
}
