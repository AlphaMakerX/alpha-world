/**
 * 地块详情模态框组件
 * 综合展示地块和建筑信息，包含"地块"和"建筑"两个 Tab 页，
 * 集成地块购买/建造操作和建筑（工厂/商店/收购站）操作面板。
 */

"use client";

import { useEffect, useState } from "react";
import { Tabs } from "antd";
import { PlotDetailSection } from "./plot-detail-section";
import { PlotActionSection } from "./plot-action-section";
import { BuildingDetailSection } from "@/client/features/building/components/building-detail-section";
import { BuildingActionSection } from "@/client/features/building/components/building-action-section";
import { RestJobHistory } from "@/client/features/residential/components/rest-job-history";
import { FactoryOrderList } from "@/client/features/factory-orders/components/factory-order-list";
import { DraggableWindow } from "@/client/components/draggable-window";
import type { PlotDetailModalProps } from "./plot-detail-modal.types";
import type { BuildingType } from "@/client/features/building/types/building-ui";
import { getBuildingCapabilities } from "@/client/features/building/model/building-capabilities";
import { getPlotCapabilities } from "@/client/features/plot/model/plot-capabilities";

/** 地块详情模态框组件 */
export function PlotDetailModal({
  selectedPlotId,
  selectedPlot,
  currentUserId,
  purchaseLoading,
  buildLoading,
  onClose,
  onPurchase,
  onBuild,
  factory,
  shop,
  purchasingStation,
  residential,
}: PlotDetailModalProps) {
  const [buildOptionsOpen, setBuildOptionsOpen] = useState(false); // 建造选项是否展开
  const [pendingBuildType, setPendingBuildType] = useState<BuildingType | null>(null); // 正在建造的建筑类型
  const [activeTabKey, setActiveTabKey] = useState("plot"); // 当前激活的 Tab 页
  // 计算地块和建筑的用户权限
  const plotCapabilities = getPlotCapabilities(selectedPlot, currentUserId);
  const buildingCapabilities = getBuildingCapabilities(selectedPlot?.building, plotCapabilities.isOwner);

  // 地块切换时重置所有操作状态，有建筑时默认显示建筑 Tab
  useEffect(() => {
    setBuildOptionsOpen(false);
    setPendingBuildType(null);
    setActiveTabKey(selectedPlot?.building ? "building" : "plot");
  }, [selectedPlot]);

  // 建筑建成后自动关闭建造选项
  useEffect(() => {
    if (plotCapabilities.hasBuilding) {
      setBuildOptionsOpen(false);
      setPendingBuildType(null);
    }
  }, [plotCapabilities.hasBuilding]);

  // 建造完成后清除待建造类型
  useEffect(() => {
    if (!buildLoading) {
      setPendingBuildType(null);
    }
  }, [buildLoading]);

  return (
    <DraggableWindow
      title={selectedPlotId ?? "地块详情"}
      open={Boolean(selectedPlot)}
      onClose={onClose}
      width={820}
      initialPosition={{ x: 72, y: 80 }}
      bodyClassName="max-h-[620px] overflow-y-auto"
    >
      {selectedPlot ? (
        <div className="space-y-3 text-sm text-slate-700">
          <Tabs
            activeKey={activeTabKey}
            onChange={setActiveTabKey}
            items={[
              {
                key: "plot",
                label: "地块",
                children: (
                  <div className="space-y-3">
                    <PlotDetailSection plot={selectedPlot} />
                    <PlotActionSection
                      canPurchase={plotCapabilities.canPurchase}
                      canBuild={plotCapabilities.canBuild}
                      hasBuilding={plotCapabilities.hasBuilding}
                      buildOptionsOpen={buildOptionsOpen}
                      purchaseLoading={purchaseLoading}
                      buildLoading={buildLoading}
                      pendingBuildType={pendingBuildType}
                      onPurchase={onPurchase}
                      onToggleBuildOptions={() => setBuildOptionsOpen((prev) => !prev)}
                      onBuild={(buildingType, factorySubtype) => {
                        setPendingBuildType(buildingType);
                        onBuild(buildingType, factorySubtype);
                      }}
                    />
                  </div>
                ),
              },
              {
                key: "building",
                label: "建筑",
                children: (
                  <div className="space-y-3">
                    <BuildingDetailSection building={selectedPlot.building} />
                    <BuildingActionSection
                      building={selectedPlot.building}
                      capabilities={buildingCapabilities}
                      factory={factory}
                      shop={shop}
                      purchasingStation={purchasingStation}
                      residential={residential}
                    />
                  </div>
                ),
              },
              ...(buildingCapabilities.isResidential
                ? [
                    {
                      key: "rest-history",
                      label: "休息记录",
                      children: (
                        <RestJobHistory jobs={residential.jobs} />
                      ),
                    },
                  ]
                : []),
              ...(buildingCapabilities.isFactory
                ? [
                    {
                      key: "order-history",
                      label: "历史订单",
                      children: (
                        <FactoryOrderList historyOrders={factory?.orders?.historyOrders} />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ) : null}
    </DraggableWindow>
  );
}
