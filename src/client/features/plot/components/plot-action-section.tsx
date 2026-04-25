/**
 * 地块操作区组件
 * 提供地块的购买和建筑建造操作，支持展开建造选项列表。
 */

import { useState } from "react";
import { Button, Popconfirm } from "antd";
import type { BuildingType } from "@/client/features/building/types/building-ui";

/** 地块操作区组件的 Props */
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
  onBuild: (buildingType: BuildingType, factorySubtype?: string) => void;
};

/** 可建造的建筑类型选项列表 */
const buildingTypeOptions: Array<{
  value: BuildingType;
  label: string;
  description: string;
}> = [
  { value: "residential", label: "住宅", description: "稳定居住型建筑" },
  { value: "factory", label: "工厂", description: "可执行生产制造" },
  { value: "shop", label: "商店", description: "商业交易型建筑" },
  { value: "purchasing_station", label: "收购站", description: "发布收购订单" },
];

/** 工厂子类型选项列表 */
const factorySubtypeOptions: Array<{
  value: string;
  label: string;
  description: string;
  cost: number;
}> = [
  { value: "mine", label: "矿场", description: "开采矿石资源", cost: 800 },
  { value: "lumber_mill", label: "伐木场", description: "采伐木材资源", cost: 800 },
  { value: "textile_mill", label: "纺织厂", description: "纺织布料", cost: 900 },
  { value: "ranch", label: "牧场", description: "养殖畜牧资源", cost: 900 },
  { value: "apothecary", label: "药房", description: "制作草药与药剂", cost: 900 },
  { value: "waterworks", label: "水厂", description: "供应清洁水源", cost: 600 },
  { value: "smelter", label: "冶炼厂", description: "冶炼金属材料", cost: 1000 },
  { value: "carpentry", label: "木工坊", description: "加工木制品", cost: 1000 },
  { value: "paper_mill", label: "造纸厂", description: "制作纸张", cost: 1000 },
  { value: "assembler", label: "组装厂", description: "组装高级产品", cost: 1200 },
];

/** 地块操作区组件，提供购买和建造功能 */
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
  const [selectingFactorySubtype, setSelectingFactorySubtype] = useState(false);

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
          <Button type="primary" ghost disabled={hasBuilding} onClick={() => {
            onToggleBuildOptions();
            setSelectingFactorySubtype(false);
          }}>
            {buildOptionsOpen ? "收起建造选项" : "建造"}
          </Button>
        ) : null}
      </div>
      {canBuild && hasBuilding ? <p className="text-amber-600">该地块已建造建筑</p> : null}
      {buildOptionsOpen && canBuild && !hasBuilding ? (
        selectingFactorySubtype ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setSelectingFactorySubtype(false)}
              >
                &larr; 返回
              </button>
              <p className="text-sm font-medium text-slate-700">选择工厂类型</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {factorySubtypeOptions.map((option) => (
                <Popconfirm
                  key={option.value}
                  title={`确认建造${option.label}吗？`}
                  description={`建造费用：${option.cost} 金币`}
                  okText="确认建造"
                  cancelText="取消"
                  onConfirm={() => onBuild("factory", option.value)}
                  disabled={buildLoading}
                >
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={buildLoading}
                  >
                    <p className="font-medium text-slate-800">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                    <p className="text-xs text-amber-600">{option.cost} 金币</p>
                    {buildLoading && pendingBuildType === "factory" ? (
                      <p className="pt-1 text-xs text-blue-600">建造中...</p>
                    ) : null}
                  </button>
                </Popconfirm>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
            {buildingTypeOptions.map((option) =>
              option.value === "factory" ? (
                <button
                  key={option.value}
                  type="button"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={buildLoading}
                  onClick={() => setSelectingFactorySubtype(true)}
                >
                  <p className="font-medium text-slate-800">{option.label}</p>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </button>
              ) : (
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
              ),
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
