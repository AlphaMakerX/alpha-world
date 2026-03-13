import type { FactoryOrder } from "@/client/features/building/types/building-ui";
import { factoryOrderStatusLabelByValue, formatDateTime, formatItemStacks } from "./factory-order-display";

type FactoryOrderCardProps = {
  order: FactoryOrder;
  className?: string;
  showCollectedAt?: boolean;
};

const statusClassNameByValue = {
  in_progress: "bg-amber-50 text-amber-700 ring-amber-200",
  collected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
} as const;

export function FactoryOrderCard({ order, className, showCollectedAt = false }: FactoryOrderCardProps) {
  return (
    <div
      className={["space-y-2 text-xs text-slate-700", className].filter(Boolean).join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">订单</p>
          <p className="font-mono text-xs font-medium text-slate-700">{order.id}</p>
          <p className="text-xs text-slate-600">配方：{order.recipeId}</p>
        </div>
        <span
          className={[
            "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
            statusClassNameByValue[order.status],
          ].join(" ")}
        >
          {factoryOrderStatusLabelByValue[order.status]}
        </span>
      </div>

      <div className="space-y-1 text-slate-600">
        <p>
          <span className="text-slate-500">开始：</span>
          {formatDateTime(order.startedAt)}
        </p>
        <p>
          <span className="text-slate-500">完成：</span>
          {formatDateTime(order.finishAt)}
        </p>
        {showCollectedAt ? (
          <p>
            <span className="text-slate-500">收取：</span>
            {formatDateTime(order.collectedAt)}
          </p>
        ) : null}
      </div>

      <div className="space-y-1 border-t border-dashed border-slate-200 pt-2">
        <p className="text-sky-800">
          <span className="font-medium">投入：</span>
          {formatItemStacks(order.inputs)}
        </p>
        <p className="text-violet-800">
          <span className="font-medium">产出：</span>
          {formatItemStacks(order.outputs)}
        </p>
      </div>
    </div>
  );
}
