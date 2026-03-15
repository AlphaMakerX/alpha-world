import type { FactoryOrder } from "@/client/features/building/types/building-ui";
import { ItemTile } from "@/client/features/inventory/components/item-tile";
import { useEffect, useState } from "react";
import { factoryOrderStatusLabelByValue, formatDateTime } from "./factory-order-display";

type FactoryOrderCardProps = {
  order: FactoryOrder;
  className?: string;
  showCollectedAt?: boolean;
};

const statusConfig = {
  in_progress: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-400" },
  collected: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-400" },
  cancelled: { badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-400" },
} as const;

function useOrderProgress(order: FactoryOrder) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (order.status !== "in_progress") return;

    const start = new Date(order.startedAt).getTime();
    const end = new Date(order.finishAt).getTime();
    const total = end - start;
    if (total <= 0) {
      setProgress(100);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, Math.max(0, (elapsed / total) * 100)));
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [order.status, order.startedAt, order.finishAt]);

  return progress;
}

function formatRemaining(finishAt: Date | string) {
  const remaining = Math.max(0, new Date(finishAt).getTime() - Date.now());
  if (remaining <= 0) return "即将完成";
  const totalSec = Math.ceil(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}时${m}分`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

export function FactoryOrderCard({ order, className, showCollectedAt = false }: FactoryOrderCardProps) {
  const progress = useOrderProgress(order);
  const status = statusConfig[order.status];

  return (
    <div
      className={[
        "rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[11px] text-slate-400">#{order.id}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">{order.recipeId}</span>
        </div>
        <span
          className={[
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
            status.badge,
          ].join(" ")}
        >
          <span className={["inline-block h-1.5 w-1.5 rounded-full", status.dot].join(" ")} />
          {factoryOrderStatusLabelByValue[order.status]}
        </span>
      </div>

      {/* Progress (in_progress only) */}
      {order.status === "in_progress" && (
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-amber-600">{formatRemaining(order.finishAt)}</span>
            <span className="tabular-nums text-slate-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Recipe visualization: inputs → outputs */}
      <div className="mt-3 rounded-lg bg-slate-50/80 p-2.5">
        <div className="flex items-center gap-2">
          {/* Inputs */}
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {order.inputs.length > 0 ? (
              order.inputs.map((item) => (
                <ItemTile key={`in-${item.itemKey}`} itemKey={item.itemKey} quantity={item.quantity} />
              ))
            ) : (
              <span className="text-[11px] text-slate-400">无</span>
            )}
          </div>

          {/* Arrow */}
          <div className="flex shrink-0 flex-col items-center gap-0.5 px-1">
            <span className="text-lg leading-none text-slate-300">→</span>
          </div>

          {/* Outputs */}
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {order.outputs.length > 0 ? (
              order.outputs.map((item) => (
                <ItemTile key={`out-${item.itemKey}`} itemKey={item.itemKey} quantity={item.quantity} />
              ))
            ) : (
              <span className="text-[11px] text-slate-400">无</span>
            )}
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
        <span>
          开始 <span className="text-slate-500">{formatDateTime(order.startedAt)}</span>
        </span>
        <span>
          完成 <span className="text-slate-500">{formatDateTime(order.finishAt)}</span>
        </span>
        {showCollectedAt && (
          <span>
            收取 <span className="text-slate-500">{formatDateTime(order.collectedAt)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
