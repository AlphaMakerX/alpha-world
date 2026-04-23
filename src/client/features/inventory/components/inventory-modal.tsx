/**
 * 背包模态框组件
 * 展示玩家的物品背包，支持按物品等级（基础材料/加工品/高级制品）筛选和分组显示。
 */

"use client";

import { useMemo, useState } from "react";
import type { AuthStatus } from "@/client/types/auth-ui";
import type { InventoryItem } from "@/client/features/building/types/building-ui";
import { DraggableWindow } from "@/client/components/draggable-window";
import { ItemTile } from "@/client/features/item/components/item-tile";
import { ItemTierFilter, type FilterOption } from "@/client/features/item/components/item-tier-filter";
import { getItemDisplay, ALL_TIERS, TIER_LABELS } from "@/client/features/item/utils/item-display";

/** 背包模态框组件的 Props */
type InventoryModalProps = {
  open: boolean;
  authStatus: AuthStatus;
  loading: boolean;
  items: InventoryItem[];
  onRefresh: () => void;
  onClose: () => void;
};

/** 背包模态框组件，展示物品列表并支持筛选和刷新 */
export function InventoryModal({ open, authStatus, loading, items, onRefresh, onClose }: InventoryModalProps) {
  const [filter, setFilter] = useState<FilterOption>("all");

  // 按数量降序排序物品
  const sortedItems = useMemo(() => [...items].sort((a, b) => b.quantity - a.quantity), [items]);

  // 统计各等级物品的数量，用于筛选按钮的计数显示
  const counts = useMemo(() => {
    const c: Record<FilterOption, number> = { all: items.length, raw_material: 0, component: 0, refined_goods: 0, end_product: 0 };
    for (const item of items) {
      const tier = getItemDisplay(item.itemKey).tier;
      c[tier]++;
    }
    return c;
  }, [items]);

  const filteredItems =
    filter === "all" ? sortedItems : sortedItems.filter((item) => getItemDisplay(item.itemKey).tier === filter);

  // "全部"模式下，按等级分组展示物品；非全部模式返回 null 使用扁平列表
  const groupedByTier = useMemo(() => {
    if (filter !== "all") return null;
    return ALL_TIERS
      .map((tier) => ({
        tier,
        label: TIER_LABELS[tier],
        items: sortedItems.filter((item) => getItemDisplay(item.itemKey).tier === tier),
      }))
      .filter((g) => g.items.length > 0);
  }, [filter, sortedItems]);

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
          <div className="flex items-center justify-between gap-2">
            <ItemTierFilter value={filter} onChange={setFilter} counts={counts} />
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className={[
                "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                loading
                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800",
              ].join(" ")}
            >
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent"
                    aria-hidden
                  />
                  <span>刷新中</span>
                </span>
              ) : (
                "刷新"
              )}
            </button>
          </div>

          {items.length ? (
            groupedByTier ? (
              <div className="space-y-4">
                {groupedByTier.map((group) => (
                  <div key={group.tier}>
                    <p className="mb-2 text-xs font-medium text-slate-400">{group.label}</p>
                    <div className="grid grid-cols-[repeat(auto-fill,72px)] gap-2">
                      {group.items.map((item) => (
                        <ItemTile key={item.itemKey} itemKey={item.itemKey} quantity={item.quantity} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,72px)] gap-2">
                {filteredItems.map((item) => (
                  <ItemTile key={item.itemKey} itemKey={item.itemKey} quantity={item.quantity} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">该分类下暂无物品</p>
            )
          ) : loading ? (
            <p className="py-8 text-center text-sm text-slate-400">加载中...</p>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">背包里暂时没有物品</p>
          )}
        </div>
      )}
    </DraggableWindow>
  );
}
