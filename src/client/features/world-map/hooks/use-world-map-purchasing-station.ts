/**
 * 收购站系统 Hook
 *
 * 管理收购站的收购订单查询、交易历史查询，
 * 以及发布收购订单、出售物品（履行订单）、取消订单等操作。
 */
"use client";

import { useCallback } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { trpc } from "@/client/lib/trpc";
import type { Plot } from "@/client/features/plot/types/plot-ui";

/** 收购站数据查询与操作 Hook */
export function useWorldMapPurchasingStation(options: {
  authStatus: "loading" | "authenticated" | "unauthenticated";
  selectedPlot: Plot | undefined;
  selectedBuildingCapabilities: { isPurchasingStation: boolean };
  messageApi: MessageInstance;
  trpcUtils: ReturnType<typeof trpc.useUtils>;
  setLoginModalOpen: (open: boolean) => void;
}) {
  const { authStatus, selectedPlot, selectedBuildingCapabilities, messageApi, trpcUtils, setLoginModalOpen } =
    options;

  const selectedPurchasingStationBuildingId =
    selectedPlot?.building?.type === "purchasing_station" ? selectedPlot.building.id : undefined;

  const { data: buyOrdersData } = trpc.purchasingStation.buyOrders.useQuery(
    { buildingId: selectedPurchasingStationBuildingId ?? 0 },
    {
      enabled: Boolean(
        selectedPurchasingStationBuildingId && selectedBuildingCapabilities.isPurchasingStation,
      ),
    },
  );

  const { data: purchasingStationTransactionHistoryData } = trpc.purchasingStation.transactionHistory.useQuery(
    { buildingId: selectedPurchasingStationBuildingId ?? 0 },
    {
      enabled: Boolean(
        selectedPurchasingStationBuildingId && selectedBuildingCapabilities.isPurchasingStation,
      ),
    },
  );

  const createBuyOrderMutation = trpc.purchasingStation.createBuyOrder.useMutation();
  const fulfillBuyOrderMutation = trpc.purchasingStation.fulfillBuyOrder.useMutation();
  const cancelBuyOrderMutation = trpc.purchasingStation.cancelBuyOrder.useMutation();

  /** 发布收购订单：预付总价后等待卖家出售 */
  const handleCreateBuyOrder = useCallback(
    async (itemKey: string, quantity: number, unitPrice: number) => {
      if (!selectedPlot?.building) {
        return;
      }
      if (authStatus !== "authenticated") {
        setLoginModalOpen(true);
        return;
      }

      try {
        await createBuyOrderMutation.mutateAsync({
          buildingId: selectedPlot.building.id,
          itemKey,
          quantity,
          unitPrice,
        });
        await Promise.all([
          trpcUtils.purchasingStation.buyOrders.invalidate(),
          trpcUtils.person.me.invalidate(),
        ]);
        messageApi.success("收购订单已发布");
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "发布失败，请稍后重试");
      }
    },
    [authStatus, createBuyOrderMutation, messageApi, selectedPlot?.building, setLoginModalOpen, trpcUtils],
  );

  /** 出售物品以履行收购订单 */
  const handleFulfillBuyOrder = useCallback(
    async (orderId: number, quantity: number) => {
      if (authStatus !== "authenticated") {
        setLoginModalOpen(true);
        return;
      }

      try {
        await fulfillBuyOrderMutation.mutateAsync({ orderId, quantity });
        await Promise.all([
          trpcUtils.purchasingStation.buyOrders.invalidate(),
          trpcUtils.purchasingStation.transactionHistory.invalidate(),
          trpcUtils.inventory.mine.invalidate(),
          trpcUtils.person.me.invalidate(),
        ]);
        messageApi.success("出售成功");
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "出售失败，请稍后重试");
      }
    },
    [authStatus, fulfillBuyOrderMutation, messageApi, setLoginModalOpen, trpcUtils],
  );

  /** 取消收购订单，预付款退回余额 */
  const handleCancelBuyOrder = useCallback(
    async (orderId: number) => {
      if (authStatus !== "authenticated") {
        setLoginModalOpen(true);
        return;
      }

      try {
        await cancelBuyOrderMutation.mutateAsync({ orderId });
        await Promise.all([
          trpcUtils.purchasingStation.buyOrders.invalidate(),
          trpcUtils.person.me.invalidate(),
        ]);
        messageApi.success("收购订单已取消");
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "取消失败，请稍后重试");
      }
    },
    [authStatus, cancelBuyOrderMutation, messageApi, setLoginModalOpen, trpcUtils],
  );

  return {
    buyOrdersData,
    purchasingStationTransactionHistoryData,
    createBuyOrderMutation,
    fulfillBuyOrderMutation,
    cancelBuyOrderMutation,
    handleCreateBuyOrder,
    handleFulfillBuyOrder,
    handleCancelBuyOrder,
  };
}
