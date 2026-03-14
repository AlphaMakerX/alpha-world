"use client";

import type { AuthStatus } from "@/client/types/auth-ui";
import type { InventoryItem } from "@/client/features/building/types/building-ui";
import { DraggableWindow } from "@/client/components/draggable-window";
import { ItemTile } from "@/client/features/inventory/components/item-tile";

type InventoryModalProps = {
  open: boolean;
  authStatus: AuthStatus;
  loading: boolean;
  items: InventoryItem[];
  onClose: () => void;
};

export function InventoryModal({ open, authStatus, loading, items, onClose }: InventoryModalProps) {
  const sortedItems = [...items].sort((a, b) => b.quantity - a.quantity);

  return (
    <DraggableWindow
      title="背包"
      open={open}
      onClose={onClose}
      width={640}
      initialPosition={{ x: 940, y: 100 }}
      bodyClassName="max-h-[70vh] overflow-y-auto"
    >
      {authStatus !== "authenticated" ? (
        <p className="text-sm text-slate-500">请先登录后查看背包</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">加载中...</p>
      ) : items.length ? (
        <div className="flex flex-wrap gap-2">
          {sortedItems.map((item) => (
            <ItemTile key={item.itemKey} itemKey={item.itemKey} quantity={item.quantity} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">背包里暂时没有物品</p>
      )}
    </DraggableWindow>
  );
}
