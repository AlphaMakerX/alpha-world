/**
 * 住宅系统 Hook
 *
 * 管理住宅的休息任务查询、发起休息、收取休息、设定休息价格等操作。
 */
"use client";

import { useCallback } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { trpc } from "@/client/lib/trpc";
import type { Plot } from "@/client/features/plot/types/plot-ui";

/** 住宅数据查询与操作 Hook */
export function useWorldMapResidential(options: {
  authStatus: "loading" | "authenticated" | "unauthenticated";
  selectedPlot: Plot | undefined;
  selectedBuildingCapabilities: { isResidential: boolean };
  messageApi: MessageInstance;
  trpcUtils: ReturnType<typeof trpc.useUtils>;
  setLoginModalOpen: (open: boolean) => void;
}) {
  const { authStatus, selectedPlot, selectedBuildingCapabilities, messageApi, trpcUtils, setLoginModalOpen } =
    options;

  const selectedResidentialBuildingId =
    selectedPlot?.building?.type === "residential" ? selectedPlot.building.id : undefined;

  const { data: restJobsData, isLoading: restJobsLoading } = trpc.residential.restJobs.useQuery(
    { buildingId: selectedResidentialBuildingId ?? 0 },
    {
      enabled: Boolean(selectedResidentialBuildingId && selectedBuildingCapabilities.isResidential),
      refetchInterval: 3000,
    },
  );

  const startRestMutation = trpc.residential.startRest.useMutation();
  const collectRestMutation = trpc.residential.collectRest.useMutation();
  const setRestPriceMutation = trpc.residential.setRestPrice.useMutation();

  /** 发起休息 */
  const handleStartRest = useCallback(
    async () => {
      if (!selectedPlot?.building) return;
      if (authStatus !== "authenticated") {
        setLoginModalOpen(true);
        return;
      }

      try {
        await startRestMutation.mutateAsync({
          buildingId: selectedPlot.building.id,
        });
        await Promise.all([
          trpcUtils.residential.restJobs.invalidate(),
          trpcUtils.person.me.invalidate(),
        ]);
        messageApi.success("已开始休息");
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "发起休息失败，请稍后重试");
      }
    },
    [authStatus, startRestMutation, messageApi, selectedPlot?.building, setLoginModalOpen, trpcUtils],
  );

  /** 收取休息 */
  const handleCollectRest = useCallback(
    async (jobId: number) => {
      if (authStatus !== "authenticated") {
        setLoginModalOpen(true);
        return;
      }

      try {
        await collectRestMutation.mutateAsync({ jobId });
        await Promise.all([
          trpcUtils.residential.restJobs.invalidate(),
          trpcUtils.person.me.invalidate(),
        ]);
        messageApi.success("体力已恢复");
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "收取失败，请稍后重试");
      }
    },
    [authStatus, collectRestMutation, messageApi, setLoginModalOpen, trpcUtils],
  );

  /** 设定休息价格 */
  const handleSetRestPrice = useCallback(
    async (price: number | null) => {
      if (!selectedPlot?.building) return;
      if (authStatus !== "authenticated") {
        setLoginModalOpen(true);
        return;
      }

      try {
        await setRestPriceMutation.mutateAsync({
          buildingId: selectedPlot.building.id,
          price,
        });
        await trpcUtils.plot.list.invalidate();
        messageApi.success(price === null ? "已关闭对外休息服务" : `休息价格已设为 ${price} 金币`);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "设定价格失败，请稍后重试");
      }
    },
    [authStatus, setRestPriceMutation, messageApi, selectedPlot?.building, setLoginModalOpen, trpcUtils],
  );

  return {
    restJobsData,
    restJobsLoading,
    startRestMutation,
    collectRestMutation,
    setRestPriceMutation,
    handleStartRest,
    handleCollectRest,
    handleSetRestPrice,
  };
}
