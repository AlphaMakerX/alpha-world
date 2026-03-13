"use client";

import { Modal, message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { createWorldMapScene, WORLD_MAP_SYNC_EVENT } from "./world-map-scene";
import { WorldMapHeader } from "./world-map-header";
import { trpc } from "@/client/lib/trpc";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthPanel } from "@/client/features/auth/components/auth-panel";
import { PlotDetailModal } from "@/client/features/plot/components/plot-detail-modal";
import { PersonDetailModal } from "@/client/features/person/components/person-detail-modal";
import { InventoryModal } from "@/client/features/inventory/components/inventory-modal";
import { getBuildingCapabilities } from "@/client/features/building/model/building-capabilities";
import type { BuildingType } from "@/client/features/building/types/building-ui";
import { getPlotCapabilities } from "@/client/features/plot/model/plot-capabilities";
import type { Plot } from "@/client/features/plot/types/plot-ui";

export function WorldMap() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [messageApi, contextHolder] = message.useMessage();
  const trpcUtils = trpc.useUtils();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const { data } = trpc.plot.list.useQuery();
  const { data: meData } = trpc.person.me.useQuery(undefined, {
    enabled: authStatus === "authenticated",
  });
  const purchaseMutation = trpc.plot.purchase.useMutation();
  const buildMutation = trpc.building.build.useMutation();
  const startProductionMutation = trpc.building.startProduction.useMutation();
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const existingPlotIds = useMemo(
    () =>
      new Set((data?.plots ?? []).map((plot) => `P${plot.x}-${String(plot.y).padStart(2, "0")}`)),
    [data?.plots],
  );
  const existingPlotIdsKey = useMemo(() => Array.from(existingPlotIds).sort().join("|"), [existingPlotIds]);
  const plotWorldIdByDbId = useMemo(() => {
    const map = new Map<number, string>();
    for (const plot of data?.plots ?? []) {
      map.set(plot.id, `P${plot.x}-${String(plot.y).padStart(2, "0")}`);
    }
    return map;
  }, [data?.plots]);
  const myPlotIds = useMemo(() => {
    const currentUserId = authStatus === "authenticated" ? meData?.user.id : undefined;
    if (!currentUserId) {
      return new Set<string>();
    }

    return new Set(
      (data?.plots ?? [])
        .filter((plot) => plot.ownerUserId === currentUserId)
        .map((plot) => `P${plot.x}-${String(plot.y).padStart(2, "0")}`),
    );
  }, [authStatus, data?.plots, meData?.user.id]);
  const myPlotIdsKey = useMemo(() => Array.from(myPlotIds).sort().join("|"), [myPlotIds]);
  const buildingTypeByPlotId = useMemo(() => {
    const map = new Map<string, BuildingType>();
    for (const plot of data?.plots ?? []) {
      const worldPlotId = plotWorldIdByDbId.get(plot.id);
      if (worldPlotId) {
        const buildingType = plot.building?.type;
        if (buildingType) {
          map.set(worldPlotId, buildingType);
        }
      }
    }
    return map;
  }, [data?.plots, plotWorldIdByDbId]);
  const buildingTypeByPlotIdKey = useMemo(
    () =>
      Array.from(buildingTypeByPlotId.entries())
        .sort(([plotA], [plotB]) => plotA.localeCompare(plotB))
        .map(([plotId, type]) => `${plotId}:${type}`)
        .join("|"),
    [buildingTypeByPlotId],
  );
  const plotById = useMemo(() => {
    const map = new Map<string, Plot>();
    for (const plot of data?.plots ?? []) {
      map.set(`P${plot.x}-${String(plot.y).padStart(2, "0")}`, plot);
    }
    return map;
  }, [data?.plots]);
  const selectedPlot = selectedPlotId ? plotById.get(selectedPlotId) : undefined;
  const currentUserId = authStatus === "authenticated" ? meData?.user.id : undefined;
  const selectedPlotCapabilities = getPlotCapabilities(selectedPlot, currentUserId);
  const selectedBuildingCapabilities = getBuildingCapabilities(
    selectedPlot?.building,
    selectedPlotCapabilities.isOwner,
  );
  const shouldFetchFactoryRecipes = selectedBuildingCapabilities.canManageFactory;
  const selectedFactoryBuildingId =
    selectedPlot?.building?.type === "factory" ? selectedPlot.building.id : undefined;
  const { data: factoryRecipesData } = trpc.building.factoryRecipes.useQuery(undefined, {
    enabled: shouldFetchFactoryRecipes,
  });
  const { data: factoryOrdersData } = trpc.building.factoryOrders.useQuery(
    { buildingId: selectedFactoryBuildingId ?? 0 },
    {
      enabled: Boolean(selectedFactoryBuildingId && selectedBuildingCapabilities.canManageFactory),
      refetchInterval: 3000,
    },
  );
  const {
    data: inventoryData,
    isFetching: inventoryLoading,
    refetch: refetchInventory,
  } = trpc.building.myInventory.useQuery(undefined, {
    enabled: authStatus === "authenticated",
  });
  const headerUsername =
    authStatus === "authenticated" ? (meData?.user.username ?? session?.user?.name ?? undefined) : undefined;
  const headerMoney = authStatus === "authenticated" ? meData?.user.money : 0;
  const myPlotCount = useMemo(() => {
    if (!currentUserId) {
      return 0;
    }
    return (data?.plots ?? []).filter((plot) => plot.ownerUserId === currentUserId).length;
  }, [currentUserId, data?.plots]);
  const myBuildingCount = useMemo(() => {
    if (!currentUserId) {
      return 0;
    }
    return (data?.plots ?? []).filter((plot) => plot.ownerUserId === currentUserId && Boolean(plot.building)).length;
  }, [currentUserId, data?.plots]);

  const handlePurchase = async () => {
    if (!selectedPlot) {
      return;
    }
    if (authStatus !== "authenticated") {
      setLoginModalOpen(true);
      return;
    }

    try {
      await purchaseMutation.mutateAsync({ plotId: selectedPlot.id });
      await Promise.all([trpcUtils.plot.list.invalidate(), trpcUtils.person.me.invalidate()]);
      messageApi.success("购买成功");
      setSelectedPlotId(null);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "购买失败，请稍后重试");
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut({ redirect: false });
      await Promise.all([trpcUtils.person.me.invalidate(), trpcUtils.plot.list.invalidate()]);
      router.refresh();
      messageApi.success("已登出");
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleBuild = async (buildingType: BuildingType) => {
    if (!selectedPlot) {
      return;
    }
    if (authStatus !== "authenticated") {
      setLoginModalOpen(true);
      return;
    }

    try {
      await buildMutation.mutateAsync({
        plotId: selectedPlot.id,
        buildingType,
      });
      await trpcUtils.plot.list.invalidate();
      messageApi.success("建造成功");
      setSelectedPlotId(null);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "建造失败，请稍后重试");
    }
  };

  const handleStartProduction = async (recipeId: string) => {
    if (!selectedPlot?.building) {
      return;
    }
    if (authStatus !== "authenticated") {
      setLoginModalOpen(true);
      return;
    }
    if (!selectedPlotCapabilities.isOwner) {
      messageApi.error("只能操作自己地块上的工厂");
      return;
    }
    if (!selectedBuildingCapabilities.isFactory) {
      messageApi.error("当前建筑不是工厂");
      return;
    }

    try {
      await startProductionMutation.mutateAsync({
        buildingId: selectedPlot.building.id,
        recipeId,
      });
      await Promise.all([
        trpcUtils.building.myInventory.invalidate(),
        trpcUtils.building.factoryOrders.invalidate(),
      ]);
      messageApi.success("已开始制造");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "开始制造失败，请稍后重试");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function bootstrapPhaser() {
      if (!containerRef.current) {
        return;
      }

      gameRef.current?.destroy(true);
      gameRef.current = null;

      const Phaser = (await import("phaser")).default;

      const WorldMapScene = createWorldMapScene(Phaser, {
        existingPlotIds,
        highlightedPlotIds: myPlotIds,
        buildingTypeByPlotId,
        onOpenExistingPlot: (plotId) => {
          setSelectedPlotId((prev) => (prev === plotId ? null : plotId));
        },
        onSceneReady: () => {
          if (!cancelled) {
            setIsGameReady(true);
          }
        },
      });

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        backgroundColor: "#d9f99d",
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.NO_CENTER,
          width: "100%",
          height: "100%",
        },
        physics: {
          default: 'arcade',
          arcade: {
            // gravity: { x: 0, y: 300 },
            debug: false
          }
        },
        scene: [WorldMapScene],
      });

      if (cancelled) {
        game.destroy(true);
        return;
      }

      gameRef.current = game;
    }

    void bootstrapPhaser();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
      setIsGameReady(false);
    };
  }, []);

  useEffect(() => {
    if (!isGameReady || !gameRef.current) {
      return;
    }

    gameRef.current.events.emit(WORLD_MAP_SYNC_EVENT, {
      existingPlotIds,
      highlightedPlotIds: myPlotIds,
      buildingTypeByPlotId,
    });
  }, [
    isGameReady,
    existingPlotIds,
    existingPlotIdsKey,
    myPlotIds,
    myPlotIdsKey,
    buildingTypeByPlotId,
    buildingTypeByPlotIdKey,
  ]);

  return (
    <section className="flex h-dvh w-screen flex-col">
      {contextHolder}
      <WorldMapHeader
        authStatus={authStatus}
        username={headerUsername}
        money={headerMoney}
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
        onLoginClick={() => setLoginModalOpen(true)}
        onLogoutClick={() => void handleLogout()}
        logoutLoading={logoutLoading}
      />
      <div
        ref={containerRef}
        className="min-h-0 w-full flex-1 overflow-hidden bg-slate-100"
      />
      <PlotDetailModal
        selectedPlotId={selectedPlotId}
        currentUserId={currentUserId}
        selectedPlot={selectedPlot}
        purchaseLoading={purchaseMutation.isPending}
        buildLoading={buildMutation.isPending}
        factoryRecipes={factoryRecipesData?.recipes ?? []}
        factoryOrders={factoryOrdersData}
        productionLoading={startProductionMutation.isPending}
        onClose={() => setSelectedPlotId(null)}
        onPurchase={() => void handlePurchase()}
        onBuild={(buildingType) => void handleBuild(buildingType)}
        onStartProduction={(recipeId) => void handleStartProduction(recipeId)}
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
        onClose={() => setInventoryModalOpen(false)}
      />
      <Modal
        title="登录后可购买地块"
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <AuthPanel onAuthSuccess={() => setLoginModalOpen(false)} />
      </Modal>
    </section>
  );
}
