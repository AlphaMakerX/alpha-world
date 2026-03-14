import type { ReactNode } from "react";
import type { Plot } from "@/client/features/plot/types/plot-ui";

type BuildingActionSectionProps = {
  building: Plot["building"];
  children?: ReactNode;
};

export function BuildingActionSection({ building, children }: BuildingActionSectionProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="font-medium text-slate-800">建筑操作</p>
      {children ? (
        children
      ) : building ? (
        <p className="text-slate-500">当前建筑暂无可用操作</p>
      ) : (
        <p className="text-slate-500">请先建造建筑后再执行建筑操作</p>
      )}
    </div>
  );
}
