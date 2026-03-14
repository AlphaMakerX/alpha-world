export type ItemDisplay = {
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

export const getItemDisplay = (itemKey: string): ItemDisplay =>
  itemDisplayByKey[itemKey] ?? {
    name: itemKey,
    icon: "◆",
    tileClassName: "border-slate-200 bg-gradient-to-b from-white to-slate-100",
    iconClassName: "bg-slate-100 text-slate-600",
  };
