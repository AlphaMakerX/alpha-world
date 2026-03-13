"use client";

import { Modal } from "antd";
import type { AuthStatus } from "@/client/types/auth-ui";
import type { InventoryItem } from "@/client/features/building/types/building-ui";

type InventoryModalProps = {
  open: boolean;
  authStatus: AuthStatus;
  loading: boolean;
  items: InventoryItem[];
  onClose: () => void;
};

export function InventoryModal({ open, authStatus, loading, items, onClose }: InventoryModalProps) {
  return (
    <Modal title="背包" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      {authStatus !== "authenticated" ? (
        <p className="text-sm text-slate-500">请先登录后查看背包</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">加载中...</p>
      ) : items.length ? (
        <div className="space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <div
              key={item.itemKey}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
            >
              <span className="font-medium text-slate-800">{item.itemKey}</span>
              <span>x{item.quantity}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">背包里暂时没有物品</p>
      )}
    </Modal>
  );
}
