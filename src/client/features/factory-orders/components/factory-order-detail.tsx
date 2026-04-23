/**
 * 制造中订单详情组件
 * 展示当前正在制造中的单个订单，无订单时显示空状态提示。
 */

import type { FactoryOrder } from "@/client/features/factory/types/factory-ui";
import { FactoryOrderCard } from "./factory-order-card";

/** 制造中订单详情组件的 Props */
type FactoryOrderDetailProps = {
  focusOrder?: FactoryOrder | null;
};

/** 制造中订单详情组件 */
export function FactoryOrderDetail({ focusOrder }: FactoryOrderDetailProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
      <p className="font-medium text-slate-800">制造中订单</p>
      {focusOrder ? (
        <FactoryOrderCard order={focusOrder} className="space-y-1 text-xs text-slate-700" />
      ) : (
        <p className="text-xs text-slate-500">当前没有制造中的订单</p>
      )}
    </div>
  );
}
