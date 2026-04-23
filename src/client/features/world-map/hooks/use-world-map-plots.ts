/**
 * 地块管理 Hook
 *
 * 负责地块数据的查询、选中状态管理、购买和建造操作。
 * 将服务端的地块数据转换为 Phaser 可渲染的格式（WorldMapRenderablePlot），
 * 并派生出选中地块的权限信息（是否为所有者、建筑能力等）。
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { trpc } from "@/client/lib/trpc";
import { getBuildingCapabilities } from "@/client/features/building/model/building-capabilities";
import type { BuildingType } from "@/client/features/building/types/building-ui";
import { getPlotCapabilities } from "@/client/features/plot/model/plot-capabilities";
import type { Plot } from "@/client/features/plot/types/plot-ui";
import type { WorldMapRenderablePlot } from "../rendering/world-map-plot";

/** 地块数据查询、选中管理与购买/建造操作 Hook */
export function useWorldMapPlots(options: {
  authStatus: "loading" | "authenticated" | "unauthenticated";
  currentUserId: string | undefined;
  messageApi: MessageInstance;
  trpcUtils: ReturnType<typeof trpc.useUtils>;
  setLoginModalOpen: (open: boolean) => void;
}) {
  const { authStatus, currentUserId, messageApi, trpcUtils, setLoginModalOpen } = options;
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  const {
    data: plotData,
    isLoading: isPlotLoading,
    isFetching: isPlotFetching,
  } = trpc.plot.list.useQuery();

  const purchaseMutation = trpc.plot.purchase.useMutation();
  const buildMutation = trpc.building.build.useMutation();

  // 将服务端地块数据转换为 Phaser 渲染所需的格式，id 格式为 P{x}-{yy}
  const worldMapPlots = useMemo<WorldMapRenderablePlot[]>(
    () =>
      (plotData?.plots ?? []).map((plot) => ({
        id: `P${plot.x}-${String(plot.y).padStart(2, "0")}`,
        ownerUserId: plot.ownerUserId,
        buildingType: plot.building?.type,
      })),
    [plotData?.plots],
  );

  // 生成地块列表的内容摘要 key，用于精确判断数据是否发生变化
  const worldMapPlotsKey = useMemo(
    () =>
      worldMapPlots
        .map((plot) => `${plot.id}:${plot.ownerUserId ?? ""}:${plot.buildingType ?? ""}`)
        .sort()
        .join("|"),
    [worldMapPlots],
  );

  // 建立 plotId -> Plot 的映射，方便通过选中 id 快速查找完整数据
  const plotById = useMemo(() => {
    const map = new Map<string, Plot>();
    for (const plot of plotData?.plots ?? []) {
      map.set(`P${plot.x}-${String(plot.y).padStart(2, "0")}`, plot);
    }
    return map;
  }, [plotData?.plots]);

  const selectedPlot = selectedPlotId ? plotById.get(selectedPlotId) : undefined;
  const selectedPlotCapabilities = getPlotCapabilities(selectedPlot, currentUserId);
  const selectedBuildingCapabilities = getBuildingCapabilities(
    selectedPlot?.building,
    selectedPlotCapabilities.isOwner,
  );

  const myPlotCount = useMemo(() => {
    if (!currentUserId) {
      return 0;
    }
    return (plotData?.plots ?? []).filter((plot) => plot.ownerUserId === currentUserId).length;
  }, [currentUserId, plotData?.plots]);

  const myBuildingCount = useMemo(() => {
    if (!currentUserId) {
      return 0;
    }
    return (plotData?.plots ?? []).filter((plot) => plot.ownerUserId === currentUserId && Boolean(plot.building))
      .length;
  }, [currentUserId, plotData?.plots]);

  /** 购买选中地块 */
  const handlePurchase = useCallback(async () => {
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
  }, [authStatus, messageApi, purchaseMutation, selectedPlot, setLoginModalOpen, trpcUtils]);

  /** 在选中地块上建造指定类型的建筑 */
  const handleBuild = useCallback(
    async (buildingType: BuildingType) => {
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
    },
    [authStatus, buildMutation, messageApi, selectedPlot, setLoginModalOpen, trpcUtils],
  );

  return {
    plotData,
    isPlotLoading,
    isPlotFetching,
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
  };
}
