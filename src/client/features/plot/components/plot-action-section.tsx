import { Button, Popconfirm } from "antd";
import type { BuildingType } from "@/client/features/building/types/building-ui";

type PlotActionSectionProps = {
  canPurchase: boolean;
  canBuild: boolean;
  hasBuilding: boolean;
  buildOptionsOpen: boolean;
  purchaseLoading: boolean;
  buildLoading: boolean;
  pendingBuildType: BuildingType | null;
  onPurchase: () => void;
  onToggleBuildOptions: () => void;
  onBuild: (buildingType: BuildingType) => void;
};

const buildingTypeOptions: Array<{
  value: BuildingType;
  label: string;
  description: string;
}> = [
  { value: "residential", label: "住宅", description: "稳定居住型建筑" },
  { value: "factory", label: "工厂", description: "可执行生产制造" },
  { value: "shop", label: "商店", description: "商业交易型建筑" },
];

export function PlotActionSection({
  canPurchase,
  canBuild,
  hasBuilding,
  buildOptionsOpen,
  purchaseLoading,
  buildLoading,
  pendingBuildType,
  onPurchase,
  onToggleBuildOptions,
  onBuild,
}: PlotActionSectionProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="font-medium text-slate-800">地块操作</p>
      <div className="flex flex-wrap gap-2">
        {canPurchase ? (
          <Popconfirm
            title="确认购买该地块吗？"
            okText="确认购买"
            cancelText="取消"
            onConfirm={onPurchase}
            disabled={purchaseLoading}
          >
            <Button type="primary" loading={purchaseLoading}>
              购买
            </Button>
          </Popconfirm>
        ) : null}
        {canBuild ? (
          <Button type="primary" ghost disabled={hasBuilding} onClick={onToggleBuildOptions}>
            {buildOptionsOpen ? "收起建造选项" : "建造"}
          </Button>
        ) : null}
      </div>
      {canBuild && hasBuilding ? <p className="text-amber-600">该地块已建造建筑</p> : null}
      {buildOptionsOpen && canBuild && !hasBuilding ? (
        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
          {buildingTypeOptions.map((option) => (
            <Popconfirm
              key={option.value}
              title={`确认建造${option.label}吗？`}
              description="建造后将占用该地块。"
              okText="确认建造"
              cancelText="取消"
              onConfirm={() => onBuild(option.value)}
              disabled={buildLoading}
            >
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={buildLoading}
              >
                <p className="font-medium text-slate-800">{option.label}</p>
                <p className="text-xs text-slate-500">{option.description}</p>
                {buildLoading && pendingBuildType === option.value ? (
                  <p className="pt-1 text-xs text-blue-600">建造中...</p>
                ) : null}
              </button>
            </Popconfirm>
          ))}
        </div>
      ) : null}
    </div>
  );
}
