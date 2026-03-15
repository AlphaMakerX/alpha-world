"use client";

import { useEffect, useState } from "react";
import { Tabs } from "antd";
import { PlotDetailSection } from "./plot-detail-section";
import { PlotActionSection } from "./plot-action-section";
import { BuildingDetailSection } from "@/client/features/building/components/building-detail-section";
import { BuildingActionSection } from "@/client/features/building/components/building-action-section";
import { FactorySection } from "@/client/features/building/components/factory-section";
import { ShopSection } from "@/client/features/shop/components/shop-section";
import { PurchasingStationSection } from "@/client/features/purchasing-station/components/purchasing-station-section";
import { DraggableWindow } from "@/client/components/draggable-window";
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
  shopListings,
  shopTransactions,
  buyOrders,
  inventoryItems,
  productionLoading,
  purchaseLoading,
  buildLoading,
  createListingLoading,
  purchaseListingLoading,
  cancelListingLoading,
  createBuyOrderLoading,
  fulfillBuyOrderLoading,
  cancelBuyOrderLoading,
  onClose,
  onPurchase,
  onBuild,
  onStartProduction,
  onCreateListing,
  onPurchaseListing,
  onCancelListing,
  onCreateBuyOrder,
  onFulfillBuyOrder,
  onCancelBuyOrder,
}: PlotDetailModalProps) {
  const [buildOptionsOpen, setBuildOptionsOpen] = useState(false);
  const [pendingBuildType, setPendingBuildType] = useState<BuildingType | null>(null);
  const [activeTabKey, setActiveTabKey] = useState("plot");
  const plotCapabilities = getPlotCapabilities(selectedPlot, currentUserId);
  const buildingCapabilities = getBuildingCapabilities(selectedPlot?.building, plotCapabilities.isOwner);
  const shouldShowFactoryRecipeList = buildingCapabilities.canManageFactory;
  const shouldShowShop = buildingCapabilities.isShop;
  const shouldShowPurchasingStation = buildingCapabilities.isPurchasingStation;

  useEffect(() => {
    if (!selectedPlot) {
      setBuildOptionsOpen(false);
      setPendingBuildType(null);
      setActiveTabKey("plot");
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
    <DraggableWindow
      title={selectedPlotId ?? "地块详情"}
      open={Boolean(selectedPlot)}
      onClose={onClose}
      width={820}
      initialPosition={{ x: 72, y: 80 }}
      bodyClassName="h-[620px] overflow-y-auto"
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
                      onBuild={(buildingType) => {
                        setPendingBuildType(buildingType);
                        onBuild(buildingType);
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
                    <BuildingActionSection building={selectedPlot.building}>
                      {shouldShowFactoryRecipeList ? (
                        <FactorySection
                          factoryRecipes={factoryRecipes}
                          factoryOrders={factoryOrders}
                          productionLoading={productionLoading}
                          onStartProduction={onStartProduction}
                        />
                      ) : shouldShowShop ? (
                        <ShopSection
                          isOwner={buildingCapabilities.canManageShop}
                          listings={shopListings}
                          transactions={shopTransactions}
                          inventoryItems={inventoryItems}
                          createListingLoading={createListingLoading}
                          purchaseLoading={purchaseListingLoading}
                          cancelLoading={cancelListingLoading}
                          onCreateListing={onCreateListing}
                          onPurchase={onPurchaseListing}
                          onCancel={onCancelListing}
                        />
                      ) : shouldShowPurchasingStation ? (
                        <PurchasingStationSection
                          isOwner={buildingCapabilities.canManagePurchasingStation}
                          orders={buyOrders}
                          createOrderLoading={createBuyOrderLoading}
                          fulfillLoading={fulfillBuyOrderLoading}
                          cancelLoading={cancelBuyOrderLoading}
                          onCreateOrder={onCreateBuyOrder}
                          onFulfill={onFulfillBuyOrder}
                          onCancel={onCancelBuyOrder}
                        />
                      ) : null}
                    </BuildingActionSection>
                  </div>
                ),
              },
            ]}
          />
        </div>
      ) : null}
    </DraggableWindow>
  );
}
