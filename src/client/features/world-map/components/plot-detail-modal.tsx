"use client";

import { Button, Modal, Select } from "antd";
import { useEffect, useState } from "react";

type PlotDetail = {
  id: string;
  status: string;
  price: number;
  ownerUserId: string | null;
  hasBuilding: boolean;
  building: {
    id: string;
    type: "residential" | "factory" | "shop";
    status: string;
  } | null;
};

type PlotDetailModalProps = {
  selectedPlotId: string | null;
  selectedPlot?: PlotDetail;
  currentUserId?: string;
  factoryRecipes: Array<{
    id: string;
    name: string;
    durationSeconds: number;
    inputs: Array<{ itemKey: string; quantity: number }>;
    outputs: Array<{ itemKey: string; quantity: number }>;
  }>;
  factoryOrders?: {
    focusOrder: {
      id: number;
      recipeId: string;
      status: "in_progress" | "collected" | "cancelled";
      startedAt: Date | string;
      finishAt: Date | string;
      collectedAt: Date | string | null;
      inputs: Array<{ itemKey: string; quantity: number }>;
      outputs: Array<{ itemKey: string; quantity: number }>;
    } | null;
    historyOrders: Array<{
      id: number;
      recipeId: string;
      status: "in_progress" | "collected" | "cancelled";
      startedAt: Date | string;
      finishAt: Date | string;
      collectedAt: Date | string | null;
      inputs: Array<{ itemKey: string; quantity: number }>;
      outputs: Array<{ itemKey: string; quantity: number }>;
    }>;
  };
  productionLoading: boolean;
  purchaseLoading: boolean;
  buildLoading: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onBuild: (buildingType: "residential" | "factory" | "shop") => void;
  onStartProduction: (recipeId: string) => void;
};

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
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [selectedBuildingType, setSelectedBuildingType] = useState<"residential" | "factory" | "shop">("residential");
  const canPurchaseSelectedPlot = Boolean(selectedPlot?.ownerUserId == null);
  const canBuildSelectedPlot = Boolean(
    selectedPlot && currentUserId && selectedPlot.ownerUserId === currentUserId,
  );
  const hasBuildingOnSelectedPlot = Boolean(selectedPlot?.hasBuilding);
  const buildingTypeLabelByValue: Record<NonNullable<PlotDetail["building"]>["type"], string> = {
    residential: "住宅",
    factory: "工厂",
    shop: "商店",
  };
  const isSelectedPlotOwner = Boolean(selectedPlot && currentUserId && selectedPlot.ownerUserId === currentUserId);
  const shouldShowFactoryRecipeList = Boolean(
    selectedPlot?.building && selectedPlot.building.type === "factory" && isSelectedPlotOwner,
  );
  const factoryOrderStatusLabelByValue: Record<"in_progress" | "collected" | "cancelled", string> = {
    in_progress: "进行中",
    collected: "已收取",
    cancelled: "已取消",
  };
  const formatDateTime = (value: Date | string | null) => {
    if (!value) {
      return "无";
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "无";
    }
    return date.toLocaleString("zh-CN");
  };
  const formatItemStacks = (items: Array<{ itemKey: string; quantity: number }>) =>
    items.length ? items.map((item) => `${item.itemKey} x${item.quantity}`).join("，") : "无";

  useEffect(() => {
    if (!selectedPlot) {
      setBuildModalOpen(false);
      setSelectedBuildingType("residential");
    }
  }, [selectedPlot]);

  return (
    <>
      <Modal
        title={selectedPlotId ? `地块详情 - ${selectedPlotId}` : "地块详情"}
        open={Boolean(selectedPlot)}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
          ...(canBuildSelectedPlot
            ? [
                <Button
                  key="build"
                  type="primary"
                  ghost
                  disabled={hasBuildingOnSelectedPlot}
                  onClick={() => setBuildModalOpen(true)}
                >
                  建造
                </Button>,
              ]
            : []),
          ...(canPurchaseSelectedPlot
            ? [
                <Button key="purchase" type="primary" loading={purchaseLoading} onClick={onPurchase}>
                  购买
                </Button>,
              ]
            : []),
        ]}
        destroyOnHidden
      >
        {selectedPlot ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>地块数据库 ID: {selectedPlot.id}</p>
            <p>状态: {selectedPlot.status}</p>
            <p>价格: {selectedPlot.price}</p>
            <p>拥有者: {selectedPlot.ownerUserId ?? "无"}</p>
            {selectedPlot.building ? (
              <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium text-slate-800">建筑信息</p>
                <p>建筑 ID: {selectedPlot.building.id}</p>
                <p>建筑类型: {buildingTypeLabelByValue[selectedPlot.building.type]}</p>
                <p>建筑状态: {selectedPlot.building.status}</p>
                {shouldShowFactoryRecipeList ? (
                  <div className="space-y-2 pt-2">
                    <p className="font-medium text-slate-800">工厂制造清单</p>
                    {factoryRecipes.length ? (
                      <div className="space-y-2">
                        {factoryRecipes.map((recipe) => (
                          <Button
                            key={recipe.id}
                            block
                            onClick={() => onStartProduction(recipe.id)}
                            loading={productionLoading}
                            disabled={productionLoading}
                          >
                            {recipe.name}（{recipe.durationSeconds} 秒）
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">暂无可用配方</p>
                    )}
                    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                      <p className="font-medium text-slate-800">重点订单</p>
                      {factoryOrders?.focusOrder ? (
                        <div className="space-y-1 text-xs text-slate-700">
                          <p>订单 ID: {factoryOrders.focusOrder.id}</p>
                          <p>配方: {factoryOrders.focusOrder.recipeId}</p>
                          <p>状态: {factoryOrderStatusLabelByValue[factoryOrders.focusOrder.status]}</p>
                          <p>开始时间: {formatDateTime(factoryOrders.focusOrder.startedAt)}</p>
                          <p>完成时间: {formatDateTime(factoryOrders.focusOrder.finishAt)}</p>
                          <p>投入: {formatItemStacks(factoryOrders.focusOrder.inputs)}</p>
                          <p>产出: {formatItemStacks(factoryOrders.focusOrder.outputs)}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">当前没有进行中的重点订单</p>
                      )}
                    </div>
                    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                      <p className="font-medium text-slate-800">历史订单</p>
                      {factoryOrders?.historyOrders.length ? (
                        <div className="max-h-48 space-y-2 overflow-y-auto pr-1 text-xs text-slate-700">
                          {factoryOrders.historyOrders.map((order) => (
                            <div key={order.id} className="rounded border border-slate-200 p-2">
                              <p>订单 ID: {order.id}</p>
                              <p>配方: {order.recipeId}</p>
                              <p>状态: {factoryOrderStatusLabelByValue[order.status]}</p>
                              <p>开始时间: {formatDateTime(order.startedAt)}</p>
                              <p>完成时间: {formatDateTime(order.finishAt)}</p>
                              <p>收取时间: {formatDateTime(order.collectedAt)}</p>
                              <p>投入: {formatItemStacks(order.inputs)}</p>
                              <p>产出: {formatItemStacks(order.outputs)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">暂无历史订单</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {canBuildSelectedPlot && hasBuildingOnSelectedPlot ? <p className="text-amber-600">该地块已建造建筑</p> : null}
          </div>
        ) : null}
      </Modal>
      <Modal
        title={selectedPlotId ? `建造建筑 - ${selectedPlotId}` : "建造建筑"}
        open={buildModalOpen}
        onCancel={() => setBuildModalOpen(false)}
        onOk={() => onBuild(selectedBuildingType)}
        okText="建造"
        cancelText="取消"
        confirmLoading={buildLoading}
        destroyOnHidden
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-700">请选择建筑类型</p>
          <Select
            className="w-full"
            value={selectedBuildingType}
            onChange={(value) => setSelectedBuildingType(value)}
            options={[
              { value: "residential", label: "住宅" },
              { value: "factory", label: "工厂" },
              { value: "shop", label: "商店" },
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
