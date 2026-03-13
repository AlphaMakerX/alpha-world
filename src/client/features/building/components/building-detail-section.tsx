import type { BuildingType } from "@/client/features/building/types/building-ui";
import type { Plot } from "@/client/features/plot/types/plot-ui";

type BuildingDetailSectionProps = {
  building: Plot["building"];
};

const buildingTypeLabelByValue: Record<BuildingType, string> = {
  residential: "住宅",
  factory: "工厂",
  shop: "商店",
};

export function BuildingDetailSection({ building }: BuildingDetailSectionProps) {
  return (
    <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="font-medium text-slate-800">建筑详情</p>
      {building ? (
        <>
          <p>建筑 ID: {building.id}</p>
          <p>建筑类型: {buildingTypeLabelByValue[building.type]}</p>
          <p>建筑状态: {building.status}</p>
        </>
      ) : (
        <p className="text-slate-500">当前地块暂无建筑</p>
      )}
    </div>
  );
}
