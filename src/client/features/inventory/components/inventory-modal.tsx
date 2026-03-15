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
  onRefresh: () => void;
  onClose: () => void;
};

export function InventoryModal({ open, authStatus, loading, items, onRefresh, onClose }: InventoryModalProps) {
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
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className={[
                "rounded border px-3 py-1 text-xs font-medium transition",
                loading
                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-1.5">
                {loading ? (
                  <span
                    className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent"
                    aria-hidden
                  />
                ) : null}
                <span>刷新背包</span>
              </span>
            </button>
          </div>
          {items.length ? (
            <div className="flex flex-wrap gap-2">
              {sortedItems.map((item) => (
                <ItemTile key={item.itemKey} itemKey={item.itemKey} quantity={item.quantity} />
              ))}
            </div>
          ) : loading ? (
            <p className="text-sm text-slate-500">加载中...</p>
          ) : (
            <p className="text-sm text-slate-500">背包里暂时没有物品</p>
          )}
        </div>
      )}
    </DraggableWindow>
  );
}
