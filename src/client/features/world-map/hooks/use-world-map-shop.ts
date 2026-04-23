/**
 * 商店系统 Hook
 *
 * 管理商店的商品列表查询、交易历史查询，
 * 以及上架、购买、下架等操作。
 */
"use client";

import { useCallback } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { trpc } from "@/client/lib/trpc";
import type { Plot } from "@/client/features/plot/types/plot-ui";

/** 商店数据查询与操作 Hook */
export function useWorldMapShop(options: {
  authStatus: "loading" | "authenticated" | "unauthenticated";
  selectedPlot: Plot | undefined;
  selectedBuildingCapabilities: { isShop: boolean };
  messageApi: MessageInstance;
  trpcUtils: ReturnType<typeof trpc.useUtils>;
  setLoginModalOpen: (open: boolean) => void;
}) {
  const { authStatus, selectedPlot, selectedBuildingCapabilities, messageApi, trpcUtils, setLoginModalOpen } =
    options;

  const selectedShopBuildingId =
    selectedPlot?.building?.type === "shop" ? selectedPlot.building.id : undefined;

  const { data: shopListingsData } = trpc.shop.listings.useQuery(
    { buildingId: selectedShopBuildingId ?? 0 },
    {
      enabled: Boolean(selectedShopBuildingId && selectedBuildingCapabilities.isShop),
    },
  );

  const { data: shopTransactionHistoryData } = trpc.shop.transactionHistory.useQuery(
    { buildingId: selectedShopBuildingId ?? 0 },
    {
      enabled: Boolean(selectedShopBuildingId && selectedBuildingCapabilities.isShop),
    },
  );

  const createShopListingMutation = trpc.shop.createListing.useMutation();
  const purchaseShopListingMutation = trpc.shop.purchase.useMutation();
  const cancelShopListingMutation = trpc.shop.cancelListing.useMutation();

  /** 上架商品到商店 */
  const handleCreateListing = useCallback(
    async (itemKey: string, quantity: number, unitPrice: number) => {
      if (!selectedPlot?.building) {
        return;
      }
      if (authStatus !== "authenticated") {
        setLoginModalOpen(true);
        return;
      }

      try {
        await createShopListingMutation.mutateAsync({
          buildingId: selectedPlot.building.id,
          itemKey,
          quantity,
          unitPrice,
        });
        await Promise.all([trpcUtils.shop.listings.invalidate(), trpcUtils.inventory.mine.invalidate()]);
        messageApi.success("商品上架成功");
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "上架失败，请稍后重试");
      }
    },
    [authStatus, createShopListingMutation, messageApi, selectedPlot?.building, setLoginModalOpen, trpcUtils],
  );

  /** 购买商店中的商品 */
  const handlePurchaseListing = useCallback(
    async (listingId: number, quantity: number) => {
      if (authStatus !== "authenticated") {
        setLoginModalOpen(true);
        return;
      }

      try {
        await purchaseShopListingMutation.mutateAsync({ listingId, quantity });
        await Promise.all([
          trpcUtils.shop.listings.invalidate(),
          trpcUtils.shop.transactionHistory.invalidate(),
          trpcUtils.inventory.mine.invalidate(),
          trpcUtils.person.me.invalidate(),
        ]);
        messageApi.success("购买成功");
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "购买失败，请稍后重试");
      }
    },
    [authStatus, messageApi, purchaseShopListingMutation, setLoginModalOpen, trpcUtils],
  );

  /** 下架商品，物品退回卖家背包 */
  const handleCancelListing = useCallback(
    async (listingId: number) => {
      if (authStatus !== "authenticated") {
        setLoginModalOpen(true);
        return;
      }

      try {
        await cancelShopListingMutation.mutateAsync({ listingId });
        await Promise.all([trpcUtils.shop.listings.invalidate(), trpcUtils.inventory.mine.invalidate()]);
        messageApi.success("商品已下架");
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "下架失败，请稍后重试");
      }
    },
    [authStatus, cancelShopListingMutation, messageApi, setLoginModalOpen, trpcUtils],
  );

  return {
    shopListingsData,
    shopTransactionHistoryData,
    createShopListingMutation,
    purchaseShopListingMutation,
    cancelShopListingMutation,
    handleCreateListing,
    handlePurchaseListing,
    handleCancelListing,
  };
}
