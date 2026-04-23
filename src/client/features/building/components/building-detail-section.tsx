/**
 * 建筑详情区组件
 * 显示建筑的基本信息（ID、类型、状态），无建筑时提示用户。
 */

import type { BuildingType } from "@/client/features/building/types/building-ui";
import type { Plot } from "@/client/features/plot/types/plot-ui";

/** 建筑详情区组件的 Props */
type BuildingDetailSectionProps = {
  building: Plot["building"];
};

/** 建筑类型枚举值到中文标签的映射 */
const buildingTypeLabelByValue: Record<BuildingType, string> = {
  residential: "住宅",
  factory: "工厂",
  shop: "商店",
  purchasing_station: "收购站",
};

/** 建筑详情区组件，展示建筑 ID、类型和状态 */
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
