"use client";

import { useEffect, useState } from "react";
import { PlotDetailSection } from "./plot-detail-section";
import { PlotActionSection } from "./plot-action-section";
import { BuildingDetailSection } from "@/client/features/building/components/building-detail-section";
import { BuildingActionSection } from "@/client/features/building/components/building-action-section";
import { DraggableModal } from "@/client/components/draggable-modal";
import type { PlotDetailModalProps } from "./plot-detail-modal.types";
import type { BuildingType } from "@/client/features/building/types/building-ui";
import { getBuildingCapabilities } from "@/client/features/building/model/building-capabilities";
import { getPlotCapabilities } from "@/client/features/plot/model/plot-capabilities";

export function PlotDetailModal({
  selectedPlotId,
  selectedPlot,
  currentUserId,
  factoryRecipes,
  factoryOrders,
  productionLoading,
  purchaseLoading,
  buildLoading,
  onClose,
  onPurchase,
  onBuild,
  onStartProduction,
}: PlotDetailModalProps) {
  const [buildOptionsOpen, setBuildOptionsOpen] = useState(false);
  const [pendingBuildType, setPendingBuildType] = useState<BuildingType | null>(null);
  const plotCapabilities = getPlotCapabilities(selectedPlot, currentUserId);
  const buildingCapabilities = getBuildingCapabilities(selectedPlot?.building, plotCapabilities.isOwner);
  const shouldShowFactoryRecipeList = buildingCapabilities.canManageFactory;

  useEffect(() => {
    if (!selectedPlot) {
      setBuildOptionsOpen(false);
      setPendingBuildType(null);
    }
  }, [selectedPlot]);

  useEffect(() => {
    if (plotCapabilities.hasBuilding) {
      setBuildOptionsOpen(false);
      setPendingBuildType(null);
    }
  }, [plotCapabilities.hasBuilding]);

  useEffect(() => {
    if (!buildLoading) {
      setPendingBuildType(null);
    }
  }, [buildLoading]);

  return (
    <DraggableModal
      title={selectedPlotId ? `${selectedPlotId}` : "地块详情"}
      open={Boolean(selectedPlot)}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      styles={{
        body: {
          height: 620,
          overflowY: "auto",
        },
      }}
    >
      {selectedPlot ? (
        <div className="space-y-3 text-sm text-slate-700">
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
            onBuild={(buildingType) => {
              setPendingBuildType(buildingType);
              onBuild(buildingType);
            }}
          />
          <BuildingDetailSection building={selectedPlot.building} />
          <BuildingActionSection
            building={selectedPlot.building}
            shouldShowFactoryRecipeList={shouldShowFactoryRecipeList}
            factoryRecipes={factoryRecipes}
            factoryOrders={factoryOrders}
            productionLoading={productionLoading}
            onStartProduction={onStartProduction}
          />
        </div>
      ) : null}
    </DraggableModal>
  );
}
