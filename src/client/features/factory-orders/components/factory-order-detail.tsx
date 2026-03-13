import type { FactoryOrder } from "@/client/features/building/types/building-ui";
import { FactoryOrderCard } from "./factory-order-card";

type FactoryOrderDetailProps = {
  focusOrder?: FactoryOrder | null;
};

export function FactoryOrderDetail({ focusOrder }: FactoryOrderDetailProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
      <p className="font-medium text-slate-800">制作中订单</p>
      {focusOrder ? (
        <FactoryOrderCard order={focusOrder} className="space-y-1 text-xs text-slate-700" />
      ) : (
        <p className="text-xs text-slate-500">当前没有制作中的订单</p>
      )}
    </div>
  );
}
