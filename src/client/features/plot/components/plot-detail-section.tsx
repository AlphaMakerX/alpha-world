import type { Plot } from "@/client/features/plot/types/plot-ui";

type PlotDetailSectionProps = {
  plot: Plot;
};

export function PlotDetailSection({ plot }: PlotDetailSectionProps) {
  return (
    <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="font-medium text-slate-800">地块详情</p>
      <p>价格: {plot.price}</p>
      <p>拥有者: {plot.ownerUsername ?? plot.ownerUserId ?? "无"}</p>
    </div>
  );
}
