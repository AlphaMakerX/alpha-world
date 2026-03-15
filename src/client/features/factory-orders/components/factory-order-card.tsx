import type { FactoryOrder } from "@/client/features/building/types/building-ui";
import { useEffect, useState } from "react";
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
  if (h > 0) return `剩余 ${h}时${m}分`;
  if (m > 0) return `剩余 ${m}分${s}秒`;
  return `剩余 ${s}秒`;
}

export function FactoryOrderCard({ order, className, showCollectedAt = false }: FactoryOrderCardProps) {
  const progress = useOrderProgress(order);

  return (
    <div
      className={["space-y-2 text-xs text-slate-700", className].filter(Boolean).join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs">
            <span className="text-slate-400">订单</span>{" "}
            <span className="font-mono font-medium text-slate-700">{order.id}</span>
          </p>
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

      {order.status === "in_progress" && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-amber-700">{formatRemaining(order.finishAt)}</span>
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
