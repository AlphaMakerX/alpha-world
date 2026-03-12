"use client";

import { Button, Modal } from "antd";

type PlotDetail = {
  id: string;
  status: string;
  price: number;
  ownerUserId: string | null;
};

type PlotDetailModalProps = {
  selectedPlotId: string | null;
  selectedPlot?: PlotDetail;
  canPurchaseSelectedPlot: boolean;
  purchaseLoading: boolean;
  onClose: () => void;
  onPurchase: () => void;
};

export function PlotDetailModal({
  selectedPlotId,
  selectedPlot,
  canPurchaseSelectedPlot,
  purchaseLoading,
  onClose,
  onPurchase,
}: PlotDetailModalProps) {
  return (
    <Modal
      title={selectedPlotId ? `地块详情 - ${selectedPlotId}` : "地块详情"}
      open={Boolean(selectedPlot)}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
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
        </div>
      ) : null}
    </Modal>
  );
}
