import { useState } from "react";
import type { BuyOrder } from "@/client/features/building/types/building-ui";
import { BuyOrderCard } from "./buy-order-card";
import { CreateBuyOrderForm } from "./create-buy-order-form";
import { ItemTierFilter, type FilterOption } from "@/client/features/item/components/item-tier-filter";
import { getItemDisplay } from "@/client/features/item/utils/item-display";

type PurchasingStationSectionProps = {
  isOwner: boolean;
  orders: BuyOrder[];
  createOrderLoading: boolean;
  fulfillLoading: boolean;
  cancelLoading: boolean;
  onCreateOrder: (itemKey: string, quantity: number, unitPrice: number) => void;
  onFulfill: (orderId: number, quantity: number) => void;
  onCancel: (orderId: number) => void;
};

export function PurchasingStationSection({
  isOwner,
  orders,
  createOrderLoading,
  fulfillLoading,
  cancelLoading,
  onCreateOrder,
  onFulfill,
  onCancel,
}: PurchasingStationSectionProps) {
  const [filter, setFilter] = useState<FilterOption>("all");

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => getItemDisplay(o.itemKey).tier === filter);

  return (
    <div className="space-y-3">
      {isOwner ? (
        <CreateBuyOrderForm
          loading={createOrderLoading}
          onCreateOrder={onCreateOrder}
        />
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">
          收购订单 {orders.length > 0 ? `(${orders.length})` : ""}
        </p>

        <ItemTierFilter value={filter} onChange={setFilter} />

        {orders.length > 0 ? (
          filteredOrders.length > 0 ? (
            <div className="space-y-2">
              {filteredOrders.map((order) => (
                <BuyOrderCard
                  key={order.id}
                  order={order}
                  isOwner={isOwner}
                  fulfillLoading={fulfillLoading}
                  cancelLoading={cancelLoading}
                  onFulfill={onFulfill}
                  onCancel={onCancel}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
              该分类下暂无订单
            </p>
          )
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
            暂无收购订单
          </p>
        )}
      </div>
    </div>
  );
}
