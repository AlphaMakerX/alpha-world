/**
 * 世界地图主组件
 *
 * 作为世界地图功能的顶层容器，整合了以下子系统：
 * - 用户会话与认证（useWorldMapSession）
 * - Phaser 游戏引擎初始化（usePhaserWorldMap）
 * - 玩家位置同步（usePlayerMapSync）
 * - 地块管理（useWorldMapPlots）
 * - 工厂系统（useWorldMapFactory）
 * - 商店系统（useWorldMapShop）
 * - 收购站系统（useWorldMapPurchasingStation）
 * 同时管理登录、背包、个人信息、游戏信息等弹窗。
 */
"use client";

import { Modal, Spin, message } from "antd";
import { useRef, useState } from "react";
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
import { useWorldMapResidential } from "../hooks/use-world-map-residential";
import { useWorldMapShop } from "../hooks/use-world-map-shop";
import { isInitialQueryLoading } from "../world-map-utils";

/** 世界地图主组件，负责组装所有子系统并渲染地图界面 */
export function WorldMap() {
  const [messageApi, contextHolder] = message.useMessage();
  const containerRef = useRef<HTMLDivElement | null>(null);       // Phaser 游戏容器 DOM 引用
  const pendingPlayerPositionRef = useRef<{ x: number; y: number } | null>(null);       // 待同步到服务端的玩家位置
  const lastSyncedPlayerPositionRef = useRef<{ x: number; y: number } | null>(null);    // 上次成功同步到服务端的位置
  const isAuthenticatedRef = useRef(false);                       // 当前是否已认证（供 Phaser 回调读取）

  // 各弹窗的开关状态
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
    headerUsername,
    headerMoney,
    headerStamina,
    logoutLoading,
    handleLogout,
    trpcUtils,
  } = useWorldMapSession({
    messageApi,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
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
    unlockRecipeMutation,
    upgradeFactoryMutation,
    handleStartProduction,
    handleUnlockRecipe,
    handleUpgradeFactory,
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

  const {
    restJobsData,
    restJobsLoading,
    startRestMutation,
    collectRestMutation,
    setRestPriceMutation,
    handleStartRest,
    handleCollectRest,
    handleSetRestPrice,
  } = useWorldMapResidential({
    authStatus,
    selectedPlot,
    selectedBuildingCapabilities,
    messageApi,
    trpcUtils,
    setLoginModalOpen,
  });

  // 判断世界数据首屏是否仍在加载，用于控制 loading 遮罩和 Phaser 初始化时机
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
    setSelectedPlotId,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
    isAuthenticatedRef,
  });

  usePlayerMapSync({
    authStatus,
    currentUserId,
    playerPosition,
    worldMapPlots,
    worldMapPlotsKey,
    isGameReady,
    gameRef,
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
        stamina={headerStamina}
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
        onBuild={(buildingType, factorySubtype) => void handleBuild(buildingType, factorySubtype)}
        factory={{
          recipes: factoryRecipesData?.recipes ?? [],
          recipesLoading: isInitialFactoryRecipesLoading,
          orders: factoryOrdersData,
          inventoryItems: inventoryData?.items ?? [],
          productionLoading: startProductionMutation.isPending,
          unlockLoading: unlockRecipeMutation.isPending,
          upgradeLoading: upgradeFactoryMutation.isPending,
          upgradePreview: factoryRecipesData?.upgradePreview ?? null,
          onStartProduction: (recipeId, quantity) => void handleStartProduction(recipeId, quantity),
          onUnlockRecipe: (recipeId) => void handleUnlockRecipe(recipeId),
          onUpgradeFactory: () => void handleUpgradeFactory(),
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
        residential={{
          jobs: restJobsData?.jobs ?? [],
          jobsLoading: restJobsLoading,
          restPrice: selectedPlot?.building?.restPrice ?? null,
          currentUserId,
          startRestLoading: startRestMutation.isPending,
          collectRestLoading: collectRestMutation.isPending,
          setRestPriceLoading: setRestPriceMutation.isPending,
          onStartRest: () => void handleStartRest(),
          onCollectRest: (jobId) => void handleCollectRest(jobId),
          onSetRestPrice: (price) => void handleSetRestPrice(price),
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
