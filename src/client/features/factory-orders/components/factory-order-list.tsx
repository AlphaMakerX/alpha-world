import type { FactoryOrder } from "@/client/features/building/types/building-ui";
import { FactoryOrderCard } from "./factory-order-card";

type FactoryOrderListProps = {
  historyOrders?: FactoryOrder[];
};

export function FactoryOrderList({ historyOrders }: FactoryOrderListProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
      <p className="font-medium text-slate-800">历史订单</p>
      {historyOrders?.length ? (
        <div className="min-h-64 max-h-64 space-y-2 overflow-y-auto pr-1 text-xs text-slate-700">
          {historyOrders.map((order) => (
            <div key={order.id} className="rounded border border-slate-200 p-2">
              <FactoryOrderCard order={order} showCollectedAt />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">暂无历史订单</p>
      )}
    </div>
  );
}
