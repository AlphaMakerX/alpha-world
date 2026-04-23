/**
 * 物品展示工具模块
 * 定义物品的展示信息（名称、图标、等级、样式），提供按 itemKey 查询展示信息的函数。
 */

/** 物品等级类型：基础材料、加工品、高级制品 */
export type ItemTier = "base_material" | "processed_goods" | "advanced_goods";

/** 物品展示信息的类型定义 */
export type ItemDisplay = {
  name: string;
  icon: string;
  tier: ItemTier;
  tileClassName: string;
  iconClassName: string;
};

/** 所有物品的展示信息配置表，以 itemKey 为键 */
const itemDisplayByKey: Record<string, ItemDisplay> = {
  money: {
    name: "金币",
    icon: "¥",
    tier: "base_material",
    tileClassName: "border-amber-200 bg-gradient-to-b from-amber-50 to-yellow-100/80",
    iconClassName: "bg-amber-100 text-amber-700",
  },
  iron_ore: {
    name: "铁矿石",
    icon: "⛏",
    tier: "base_material",
    tileClassName: "border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200/90",
    iconClassName: "bg-slate-200 text-slate-700",
  },
  wood: {
    name: "木材",
    icon: "🪵",
    tier: "base_material",
    tileClassName: "border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100/80",
    iconClassName: "bg-amber-200 text-amber-800",
  },
  cotton: {
    name: "棉花",
    icon: "✿",
    tier: "base_material",
    tileClassName: "border-fuchsia-200 bg-gradient-to-b from-fuchsia-50 to-rose-100/70",
    iconClassName: "bg-fuchsia-100 text-fuchsia-700",
  },
  coal: {
    name: "煤炭",
    icon: "◼",
    tier: "base_material",
    tileClassName: "border-zinc-400 bg-gradient-to-b from-zinc-100 to-zinc-300/90",
    iconClassName: "bg-zinc-700 text-zinc-100",
  },
  water: {
    name: "水资源",
    icon: "💧",
    tier: "base_material",
    tileClassName: "border-cyan-200 bg-gradient-to-b from-cyan-50 to-sky-100/80",
    iconClassName: "bg-cyan-100 text-cyan-700",
  },
  stone: {
    name: "石料",
    icon: "🪨",
    tier: "base_material",
    tileClassName: "border-stone-300 bg-gradient-to-b from-stone-100 to-stone-200/90",
    iconClassName: "bg-stone-200 text-stone-700",
  },
  iron_ingot: {
    name: "铁锭",
    icon: "⚙",
    tier: "processed_goods",
    tileClassName: "border-indigo-200 bg-gradient-to-b from-indigo-50 to-slate-100/90",
    iconClassName: "bg-indigo-100 text-indigo-700",
  },
  wood_plank: {
    name: "木板",
    icon: "▤",
    tier: "processed_goods",
    tileClassName: "border-orange-200 bg-gradient-to-b from-orange-50 to-amber-100/80",
    iconClassName: "bg-orange-100 text-orange-700",
  },
  cloth: {
    name: "布料",
    icon: "🧵",
    tier: "processed_goods",
    tileClassName: "border-emerald-200 bg-gradient-to-b from-emerald-50 to-teal-100/70",
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  steel: {
    name: "钢材",
    icon: "🛠",
    tier: "processed_goods",
    tileClassName: "border-slate-400 bg-gradient-to-b from-slate-50 to-slate-200/80",
    iconClassName: "bg-slate-300 text-slate-800",
  },
  brick: {
    name: "砖块",
    icon: "🧱",
    tier: "processed_goods",
    tileClassName: "border-rose-200 bg-gradient-to-b from-rose-50 to-orange-100/80",
    iconClassName: "bg-rose-100 text-rose-700",
  },
  paper: {
    name: "纸张",
    icon: "📄",
    tier: "processed_goods",
    tileClassName: "border-zinc-200 bg-gradient-to-b from-zinc-50 to-slate-100/80",
    iconClassName: "bg-zinc-100 text-zinc-700",
  },
  rope: {
    name: "绳索",
    icon: "🪢",
    tier: "processed_goods",
    tileClassName: "border-amber-300 bg-gradient-to-b from-amber-50 to-yellow-100/80",
    iconClassName: "bg-amber-100 text-amber-700",
  },
  furniture: {
    name: "家具",
    icon: "🪑",
    tier: "advanced_goods",
    tileClassName: "border-orange-300 bg-gradient-to-b from-orange-50 to-amber-100/90",
    iconClassName: "bg-orange-200 text-orange-800",
  },
  tools: {
    name: "工具组",
    icon: "🧰",
    tier: "advanced_goods",
    tileClassName: "border-sky-200 bg-gradient-to-b from-sky-50 to-cyan-100/80",
    iconClassName: "bg-sky-100 text-sky-700",
  },
  machine_parts: {
    name: "机器零件",
    icon: "⚙️",
    tier: "advanced_goods",
    tileClassName: "border-indigo-300 bg-gradient-to-b from-indigo-50 to-violet-100/80",
    iconClassName: "bg-indigo-100 text-indigo-700",
  },
  sculpture: {
    name: "雕塑",
    icon: "🗿",
    tier: "advanced_goods",
    tileClassName: "border-stone-300 bg-gradient-to-b from-stone-50 to-stone-200/90",
    iconClassName: "bg-stone-200 text-stone-800",
  },
  books: {
    name: "书籍",
    icon: "📚",
    tier: "advanced_goods",
    tileClassName: "border-lime-200 bg-gradient-to-b from-lime-50 to-emerald-100/80",
    iconClassName: "bg-lime-100 text-lime-700",
  },
  reinforced_wall: {
    name: "加固墙材",
    icon: "🏗",
    tier: "advanced_goods",
    tileClassName: "border-neutral-300 bg-gradient-to-b from-neutral-100 to-zinc-200/90",
    iconClassName: "bg-neutral-200 text-neutral-700",
  },
  backpack: {
    name: "背包",
    icon: "🎒",
    tier: "advanced_goods",
    tileClassName: "border-emerald-300 bg-gradient-to-b from-emerald-50 to-green-100/80",
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
};

/** 物品等级到中文标签的映射 */
export const TIER_LABELS: Record<ItemTier, string> = {
  base_material: "基础材料",
  processed_goods: "加工品",
  advanced_goods: "高级制品",
};

/** 所有物品等级的有序列表 */
export const ALL_TIERS: ItemTier[] = ["base_material", "processed_goods", "advanced_goods"];

/** 根据 itemKey 获取物品展示信息，未知物品返回默认展示 */
export const getItemDisplay = (itemKey: string): ItemDisplay =>
  itemDisplayByKey[itemKey] ?? {
    name: itemKey,
    icon: "◆",
    tier: "base_material" as ItemTier,
    tileClassName: "border-slate-200 bg-gradient-to-b from-white to-slate-100",
    iconClassName: "bg-slate-100 text-slate-600",
  };
