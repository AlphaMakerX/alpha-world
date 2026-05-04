/**
 * 历史订单列表组件
 * 展示工厂已完成/已取消的历史订单列表，支持滚动浏览。
 */

import type { FactoryOrder } from "@/client/features/factory/types/factory-ui";
import { FactoryOrderCard } from "./factory-order-card";

/** 历史订单列表组件的 Props */
type FactoryOrderListProps = {
  historyOrders?: FactoryOrder[];
};

/** 历史订单列表组件 */
export function FactoryOrderList({ historyOrders }: FactoryOrderListProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
      <p className="font-medium text-slate-800">历史订单</p>
      {historyOrders?.length ? (
        <div className="space-y-2 text-xs text-slate-700">
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
