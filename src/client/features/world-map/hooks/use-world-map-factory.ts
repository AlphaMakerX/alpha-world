/**
 * 工厂系统 Hook
 *
 * 管理工厂相关的数据查询与操作，包括：
 * - 查询工厂配方列表
 * - 查询当前工厂的生产订单（进行中的订单自动轮询）
 * - 发起生产操作
 */
"use client";

import { useCallback } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { trpc } from "@/client/lib/trpc";
import type { Plot } from "@/client/features/plot/types/plot-ui";
import { isInitialQueryLoading } from "../world-map-utils";

/** 工厂系统数据查询与操作 Hook */
export function useWorldMapFactory(options: {
  authStatus: "loading" | "authenticated" | "unauthenticated";
  selectedPlot: Plot | undefined;
  selectedPlotCapabilities: { isOwner: boolean };
  selectedBuildingCapabilities: { canManageFactory: boolean; isFactory: boolean };
  messageApi: MessageInstance;
  trpcUtils: ReturnType<typeof trpc.useUtils>;
  setLoginModalOpen: (open: boolean) => void;
}) {
  const {
    authStatus,
    selectedPlot,
    selectedPlotCapabilities,
    selectedBuildingCapabilities,
    messageApi,
    trpcUtils,
    setLoginModalOpen,
  } = options;

  const shouldFetchFactoryRecipes = selectedBuildingCapabilities.canManageFactory;
  const selectedFactoryBuildingId =
    selectedPlot?.building?.type === "factory" ? selectedPlot.building.id : undefined;

  const {
    data: factoryRecipesData,
    isLoading: isFactoryRecipesLoading,
    isFetching: isFactoryRecipesFetching,
  } = trpc.factory.recipes.useQuery(undefined, {
    enabled: shouldFetchFactoryRecipes,
  });

  const { data: factoryOrdersData } = trpc.factory.orders.useQuery(
    { buildingId: selectedFactoryBuildingId ?? 0 },
    {
      enabled: Boolean(selectedFactoryBuildingId && selectedBuildingCapabilities.canManageFactory),
      refetchInterval: (query) => (query.state.data?.focusOrder ? 3000 : false),
    },
  );

  const startProductionMutation = trpc.factory.startProduction.useMutation();

  const isInitialFactoryRecipesLoading = isInitialQueryLoading({
    enabled: shouldFetchFactoryRecipes,
    hasData: Boolean(factoryRecipesData),
    isLoading: isFactoryRecipesLoading,
    isFetching: isFactoryRecipesFetching,
  });

  /** 开始生产：校验权限后调用 mutation，成功后刷新背包、订单和用户数据 */
  const handleStartProduction = useCallback(
    async (recipeId: string, quantity: number = 1) => {
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
          quantity,
        });
        await Promise.all([
          trpcUtils.inventory.mine.invalidate(),
          trpcUtils.factory.orders.invalidate(),
          trpcUtils.person.me.invalidate(),
        ]);
        messageApi.success("已开始制造");
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "开始制造失败，请稍后重试");
      }
    },
    [
      authStatus,
      messageApi,
      selectedBuildingCapabilities.isFactory,
      selectedPlot,
      selectedPlotCapabilities.isOwner,
      setLoginModalOpen,
      startProductionMutation,
      trpcUtils,
    ],
  );

  return {
    factoryRecipesData,
    factoryOrdersData,
    isInitialFactoryRecipesLoading,
    startProductionMutation,
    handleStartProduction,
  };
}
