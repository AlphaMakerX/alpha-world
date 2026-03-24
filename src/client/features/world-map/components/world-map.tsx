"use client";

import { Modal, Spin, message } from "antd";
import { useRef, useState } from "react";
import type { PlayerStaminaPayload } from "./world-map-scene";
import { WorldMapHeader } from "./world-map-header";
import { AuthPanel } from "@/client/features/auth/components/auth-panel";
import { GameInfoModal } from "@/client/features/game-info/components/game-info-modal";
import { InventoryModal } from "@/client/features/inventory/components/inventory-modal";
import { PersonDetailModal } from "@/client/features/person/components/person-detail-modal";
import { PlotDetailModal } from "@/client/features/plot/components/plot-detail-modal";
import { usePhaserWorldMap } from "../hooks/use-phaser-world-map";
import { usePlayerMapSync } from "../hooks/use-player-map-sync";
import { useWorldMapFactory } from "../hooks/use-world-map-factory";
import { useWorldMapPlots } from "../hooks/use-world-map-plots";
import { useWorldMapPurchasingStation } from "../hooks/use-world-map-purchasing-station";
import { useWorldMapSession } from "../hooks/use-world-map-session";
import { useWorldMapShop } from "../hooks/use-world-map-shop";
import { DEFAULT_PLAYER_STAMINA } from "../world-map-constants";
import { isInitialQueryLoading } from "../world-map-utils";

export function WorldMap() {
  const [messageApi, contextHolder] = message.useMessage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingPlayerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastSyncedPlayerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isAuthenticatedRef = useRef(false);
  const [playerStamina, setPlayerStamina] = useState<PlayerStaminaPayload>(DEFAULT_PLAYER_STAMINA);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [gameInfoModalOpen, setGameInfoModalOpen] = useState(false);

  const {
    authStatus,
    meData,
    isMeLoading,
    isMeFetching,
    updatePositionMutation,
    inventoryData,
    inventoryLoading,
    refetchInventory,
    currentUserId,
    playerPosition,
    serverPlayerStamina,
    headerUsername,
    headerMoney,
    logoutLoading,
    handleLogout,
    trpcUtils,
  } = useWorldMapSession({
    messageApi,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
    setPlayerStamina,
  });

  const {
    isPlotLoading,
    isPlotFetching,
    plotData,
    selectedPlotId,
    setSelectedPlotId,
    worldMapPlots,
    worldMapPlotsKey,
    selectedPlot,
    selectedPlotCapabilities,
    selectedBuildingCapabilities,
    myPlotCount,
    myBuildingCount,
    purchaseMutation,
    buildMutation,
    handlePurchase,
    handleBuild,
  } = useWorldMapPlots({
    authStatus,
    currentUserId,
    messageApi,
    trpcUtils,
    setLoginModalOpen,
  });

  const {
    factoryRecipesData,
    factoryOrdersData,
    isInitialFactoryRecipesLoading,
    startProductionMutation,
    handleStartProduction,
  } = useWorldMapFactory({
    authStatus,
    selectedPlot,
    selectedPlotCapabilities,
    selectedBuildingCapabilities,
    messageApi,
    trpcUtils,
    setLoginModalOpen,
  });

  const {
    shopListingsData,
    shopTransactionHistoryData,
    createShopListingMutation,
    purchaseShopListingMutation,
    cancelShopListingMutation,
    handleCreateListing,
    handlePurchaseListing,
    handleCancelListing,
  } = useWorldMapShop({
    authStatus,
    selectedPlot,
    selectedBuildingCapabilities,
    messageApi,
    trpcUtils,
    setLoginModalOpen,
  });

  const {
    buyOrdersData,
    purchasingStationTransactionHistoryData,
    createBuyOrderMutation,
    fulfillBuyOrderMutation,
    cancelBuyOrderMutation,
    handleCreateBuyOrder,
    handleFulfillBuyOrder,
    handleCancelBuyOrder,
  } = useWorldMapPurchasingStation({
    authStatus,
    selectedPlot,
    selectedBuildingCapabilities,
    messageApi,
    trpcUtils,
    setLoginModalOpen,
  });

  const isAuthStatusResolving = authStatus === "loading";
  const isInitialPlotDataLoading = isInitialQueryLoading({
    enabled: true,
    hasData: Boolean(plotData),
    isLoading: isPlotLoading,
    isFetching: isPlotFetching,
  });
  const isInitialMeDataLoading = isInitialQueryLoading({
    enabled: authStatus === "authenticated",
    hasData: Boolean(meData),
    isLoading: isMeLoading,
    isFetching: isMeFetching,
  });
  const isInitialWorldDataLoading =
    isAuthStatusResolving || isInitialPlotDataLoading || isInitialMeDataLoading;

  const { gameRef, isGameReady } = usePhaserWorldMap({
    containerRef,
    isInitialWorldDataLoading,
    worldMapPlots,
    currentUserId,
    playerPosition,
    serverPlayerStamina,
    setPlayerStamina,
    setSelectedPlotId,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
    isAuthenticatedRef,
  });

  usePlayerMapSync({
    authStatus,
    currentUserId,
    playerPosition,
    serverPlayerStamina,
    worldMapPlots,
    worldMapPlotsKey,
    isGameReady,
    gameRef,
    setPlayerStamina,
    updatePositionMutation,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
    isAuthenticatedRef,
  });

  return (
    <section className="flex h-dvh w-screen flex-col">
      {contextHolder}
      <WorldMapHeader
        authStatus={authStatus}
        username={headerUsername}
        money={headerMoney}
        staminaCurrent={playerStamina.current}
        staminaMax={playerStamina.max}
        onOpenProfileClick={() => {
          if (authStatus !== "authenticated") {
            setLoginModalOpen(true);
            return;
          }
          setPersonModalOpen(true);
        }}
        onOpenInventoryClick={() => {
          setInventoryModalOpen(true);
          void refetchInventory();
        }}
        onOpenGameInfoClick={() => setGameInfoModalOpen(true)}
        onLoginClick={() => setLoginModalOpen(true)}
        onLogoutClick={() => void handleLogout()}
        logoutLoading={logoutLoading}
      />
      <div
        ref={containerRef}
        className="relative min-h-0 w-full flex-1 overflow-hidden bg-slate-100"
      >
        {isInitialWorldDataLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90">
            <Spin size="large" description="地图数据加载中..." />
          </div>
        ) : null}
      </div>
      <PlotDetailModal
        selectedPlotId={selectedPlotId}
        currentUserId={currentUserId}
        selectedPlot={selectedPlot}
        purchaseLoading={purchaseMutation.isPending}
        buildLoading={buildMutation.isPending}
        onClose={() => setSelectedPlotId(null)}
        onPurchase={() => void handlePurchase()}
        onBuild={(buildingType) => void handleBuild(buildingType)}
        factory={{
          recipes: factoryRecipesData?.recipes ?? [],
          recipesLoading: isInitialFactoryRecipesLoading,
          orders: factoryOrdersData,
          inventoryItems: inventoryData?.items ?? [],
          productionLoading: startProductionMutation.isPending,
          onStartProduction: (recipeId, quantity) => void handleStartProduction(recipeId, quantity),
        }}
        shop={{
          listings: shopListingsData?.listings ?? [],
          inventoryItems: inventoryData?.items ?? [],
          transactions: shopTransactionHistoryData?.transactions ?? [],
          createListingLoading: createShopListingMutation.isPending,
          purchaseLoading: purchaseShopListingMutation.isPending,
          cancelLoading: cancelShopListingMutation.isPending,
          onCreateListing: (itemKey, quantity, unitPrice) => void handleCreateListing(itemKey, quantity, unitPrice),
          onPurchase: (listingId, quantity) => void handlePurchaseListing(listingId, quantity),
          onCancel: (listingId) => void handleCancelListing(listingId),
        }}
        purchasingStation={{
          orders: buyOrdersData?.orders ?? [],
          transactions: purchasingStationTransactionHistoryData?.transactions ?? [],
          createOrderLoading: createBuyOrderMutation.isPending,
          fulfillLoading: fulfillBuyOrderMutation.isPending,
          cancelLoading: cancelBuyOrderMutation.isPending,
          onCreateOrder: (itemKey, quantity, unitPrice) => void handleCreateBuyOrder(itemKey, quantity, unitPrice),
          onFulfill: (orderId, quantity) => void handleFulfillBuyOrder(orderId, quantity),
          onCancel: (orderId) => void handleCancelBuyOrder(orderId),
        }}
      />
      <PersonDetailModal
        open={personModalOpen}
        authStatus={authStatus}
        username={headerUsername}
        money={headerMoney}
        plotCount={myPlotCount}
        buildingCount={myBuildingCount}
        onClose={() => setPersonModalOpen(false)}
      />
      <InventoryModal
        open={inventoryModalOpen}
        authStatus={authStatus}
        loading={inventoryLoading}
        items={inventoryData?.items ?? []}
        onRefresh={() => void refetchInventory()}
        onClose={() => setInventoryModalOpen(false)}
      />
      <GameInfoModal
        open={gameInfoModalOpen}
        onClose={() => setGameInfoModalOpen(false)}
      />
      <Modal
        title="登录后可购买地块"
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        footer={null}
        destroyOnHidden
        afterClose={() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
      >
        <AuthPanel onAuthSuccess={() => setLoginModalOpen(false)} />
      </Modal>
    </section>
  );
}
