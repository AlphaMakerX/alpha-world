"use client";

import { Modal } from "antd";
import type { AuthStatus } from "@/client/types/auth-ui";
import type { InventoryItem } from "@/client/features/building/types/building-ui";

type ItemDisplay = {
  name: string;
  icon: string;
  tileClassName: string;
  iconClassName: string;
};

const itemDisplayByKey: Record<string, ItemDisplay> = {
  money: {
    name: "金币",
    icon: "¥",
    tileClassName: "border-amber-200 bg-gradient-to-b from-amber-50 to-yellow-100/80",
    iconClassName: "bg-amber-100 text-amber-700",
  },
  iron_ore: {
    name: "铁矿石",
    icon: "⛏",
    tileClassName: "border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200/90",
    iconClassName: "bg-slate-200 text-slate-700",
  },
  wood: {
    name: "木材",
    icon: "🪵",
    tileClassName: "border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100/80",
    iconClassName: "bg-amber-200 text-amber-800",
  },
  cotton: {
    name: "棉花",
    icon: "✿",
    tileClassName: "border-fuchsia-200 bg-gradient-to-b from-fuchsia-50 to-rose-100/70",
    iconClassName: "bg-fuchsia-100 text-fuchsia-700",
  },
  coal: {
    name: "煤炭",
    icon: "◼",
    tileClassName: "border-zinc-400 bg-gradient-to-b from-zinc-100 to-zinc-300/90",
    iconClassName: "bg-zinc-700 text-zinc-100",
  },
  water: {
    name: "水资源",
    icon: "💧",
    tileClassName: "border-cyan-200 bg-gradient-to-b from-cyan-50 to-sky-100/80",
    iconClassName: "bg-cyan-100 text-cyan-700",
  },
  iron_ingot: {
    name: "铁锭",
    icon: "⚙",
    tileClassName: "border-indigo-200 bg-gradient-to-b from-indigo-50 to-slate-100/90",
    iconClassName: "bg-indigo-100 text-indigo-700",
  },
  wood_plank: {
    name: "木板",
    icon: "▤",
    tileClassName: "border-orange-200 bg-gradient-to-b from-orange-50 to-amber-100/80",
    iconClassName: "bg-orange-100 text-orange-700",
  },
  cloth: {
    name: "布料",
    icon: "🧵",
    tileClassName: "border-emerald-200 bg-gradient-to-b from-emerald-50 to-teal-100/70",
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
};

const getItemDisplay = (itemKey: string): ItemDisplay =>
  itemDisplayByKey[itemKey] ?? {
    name: itemKey,
    icon: "◆",
    tileClassName: "border-slate-200 bg-gradient-to-b from-white to-slate-100",
    iconClassName: "bg-slate-100 text-slate-600",
  };

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
    <Modal title="背包" open={open} onCancel={onClose} footer={null} destroyOnHidden width={640}>
      {authStatus !== "authenticated" ? (
        <p className="text-sm text-slate-500">请先登录后查看背包</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">加载中...</p>
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {sortedItems.map((item) => {
            const itemDisplay = getItemDisplay(item.itemKey);
            return (
            <div
              key={item.itemKey}
              className={[
                "group relative overflow-hidden rounded-xl border p-2.5 shadow-sm transition",
                "hover:-translate-y-0.5 hover:shadow-md",
                itemDisplay.tileClassName,
              ].join(" ")}
            >
              <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-white/40 blur-xl" />
              <div className="relative flex items-start justify-between gap-2">
                <div>
                  <div
                    className={[
                      "mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-base shadow-sm",
                      itemDisplay.iconClassName,
                    ].join(" ")}
                  >
                    {itemDisplay.icon}
                  </div>
                  <p className="font-medium leading-none text-slate-800">{itemDisplay.name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{item.itemKey}</p>
                </div>
                <span className="rounded-md bg-white/75 px-2 py-1 text-xs font-semibold text-slate-700">
                  x{item.quantity}
                </span>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">背包里暂时没有物品</p>
      )}
    </Modal>
  );
}
