/**
 * 物品展示工具模块
 * 定义物品的展示信息（名称、图标、等级、样式），提供按 itemKey 查询展示信息的函数。
 */

/** 物品等级类型：原材料、加工件、精制品、成品 */
export type ItemTier = "raw_material" | "component" | "refined_goods" | "end_product";

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
    tier: "raw_material",
    tileClassName: "border-amber-200 bg-gradient-to-b from-amber-50 to-yellow-100/80",
    iconClassName: "bg-amber-100 text-amber-700",
  },
  stamina: {
    name: "体力",
    icon: "⚡",
    tier: "raw_material",
    tileClassName: "border-sky-200 bg-gradient-to-b from-sky-50 to-blue-100/80",
    iconClassName: "bg-sky-100 text-sky-700",
  },

  // ── 原材料 (raw_material) ──
  wood: {
    name: "木材",
    icon: "🪵",
    tier: "raw_material",
    tileClassName: "border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100/80",
    iconClassName: "bg-amber-200 text-amber-800",
  },
  iron_ore: {
    name: "铁矿石",
    icon: "⛏",
    tier: "raw_material",
    tileClassName: "border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200/90",
    iconClassName: "bg-slate-200 text-slate-700",
  },
  copper_ore: {
    name: "铜矿石",
    icon: "⛏",
    tier: "raw_material",
    tileClassName: "border-orange-300 bg-gradient-to-b from-orange-50 to-orange-200/80",
    iconClassName: "bg-orange-200 text-orange-700",
  },
  coal: {
    name: "煤炭",
    icon: "◼",
    tier: "raw_material",
    tileClassName: "border-zinc-400 bg-gradient-to-b from-zinc-100 to-zinc-300/90",
    iconClassName: "bg-zinc-700 text-zinc-100",
  },
  stone: {
    name: "石料",
    icon: "🪨",
    tier: "raw_material",
    tileClassName: "border-stone-300 bg-gradient-to-b from-stone-100 to-stone-200/90",
    iconClassName: "bg-stone-200 text-stone-700",
  },
  sand: {
    name: "沙子",
    icon: "🏖",
    tier: "raw_material",
    tileClassName: "border-yellow-200 bg-gradient-to-b from-yellow-50 to-amber-100/80",
    iconClassName: "bg-yellow-100 text-yellow-700",
  },
  clay: {
    name: "粘土",
    icon: "🏺",
    tier: "raw_material",
    tileClassName: "border-orange-200 bg-gradient-to-b from-orange-50 to-amber-100/80",
    iconClassName: "bg-orange-100 text-orange-700",
  },
  cotton: {
    name: "棉花",
    icon: "✿",
    tier: "raw_material",
    tileClassName: "border-fuchsia-200 bg-gradient-to-b from-fuchsia-50 to-rose-100/70",
    iconClassName: "bg-fuchsia-100 text-fuchsia-700",
  },
  flax: {
    name: "亚麻",
    icon: "🌾",
    tier: "raw_material",
    tileClassName: "border-lime-200 bg-gradient-to-b from-lime-50 to-green-100/70",
    iconClassName: "bg-lime-100 text-lime-700",
  },
  raw_hide: {
    name: "生皮",
    icon: "🐄",
    tier: "raw_material",
    tileClassName: "border-amber-300 bg-gradient-to-b from-amber-50 to-yellow-100/80",
    iconClassName: "bg-amber-200 text-amber-700",
  },
  herbs: {
    name: "草药",
    icon: "🌿",
    tier: "raw_material",
    tileClassName: "border-green-200 bg-gradient-to-b from-green-50 to-emerald-100/80",
    iconClassName: "bg-green-100 text-green-700",
  },
  water: {
    name: "水资源",
    icon: "💧",
    tier: "raw_material",
    tileClassName: "border-cyan-200 bg-gradient-to-b from-cyan-50 to-sky-100/80",
    iconClassName: "bg-cyan-100 text-cyan-700",
  },
  animal_fat: {
    name: "动物油脂",
    icon: "🍖",
    tier: "raw_material",
    tileClassName: "border-amber-200 bg-gradient-to-b from-amber-50 to-orange-100/70",
    iconClassName: "bg-amber-100 text-amber-700",
  },

  // ── 加工件 (component) ──
  wood_plank: {
    name: "木板",
    icon: "▤",
    tier: "component",
    tileClassName: "border-orange-200 bg-gradient-to-b from-orange-50 to-amber-100/80",
    iconClassName: "bg-orange-100 text-orange-700",
  },
  charcoal: {
    name: "木炭",
    icon: "▪",
    tier: "component",
    tileClassName: "border-zinc-400 bg-gradient-to-b from-zinc-200 to-zinc-300/90",
    iconClassName: "bg-zinc-600 text-zinc-100",
  },
  iron_ingot: {
    name: "铁锭",
    icon: "⚙",
    tier: "component",
    tileClassName: "border-indigo-200 bg-gradient-to-b from-indigo-50 to-slate-100/90",
    iconClassName: "bg-indigo-100 text-indigo-700",
  },
  copper_ingot: {
    name: "铜锭",
    icon: "⬣",
    tier: "component",
    tileClassName: "border-orange-300 bg-gradient-to-b from-orange-50 to-amber-100/90",
    iconClassName: "bg-orange-200 text-orange-800",
  },
  nails: {
    name: "铁钉",
    icon: "📌",
    tier: "component",
    tileClassName: "border-slate-300 bg-gradient-to-b from-slate-50 to-slate-200/80",
    iconClassName: "bg-slate-200 text-slate-700",
  },
  thread: {
    name: "丝线",
    icon: "🧶",
    tier: "component",
    tileClassName: "border-pink-200 bg-gradient-to-b from-pink-50 to-rose-100/70",
    iconClassName: "bg-pink-100 text-pink-700",
  },
  cloth: {
    name: "布料",
    icon: "🧵",
    tier: "component",
    tileClassName: "border-emerald-200 bg-gradient-to-b from-emerald-50 to-teal-100/70",
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  linen: {
    name: "亚麻布",
    icon: "🧻",
    tier: "component",
    tileClassName: "border-lime-200 bg-gradient-to-b from-lime-50 to-green-100/70",
    iconClassName: "bg-lime-100 text-lime-700",
  },
  rope: {
    name: "绳索",
    icon: "🪢",
    tier: "component",
    tileClassName: "border-amber-300 bg-gradient-to-b from-amber-50 to-yellow-100/80",
    iconClassName: "bg-amber-100 text-amber-700",
  },
  leather: {
    name: "皮革",
    icon: "🧤",
    tier: "component",
    tileClassName: "border-amber-400 bg-gradient-to-b from-amber-50 to-amber-200/80",
    iconClassName: "bg-amber-200 text-amber-800",
  },
  dye: {
    name: "染料",
    icon: "🎨",
    tier: "component",
    tileClassName: "border-violet-200 bg-gradient-to-b from-violet-50 to-purple-100/70",
    iconClassName: "bg-violet-100 text-violet-700",
  },
  brick: {
    name: "砖块",
    icon: "🧱",
    tier: "component",
    tileClassName: "border-rose-200 bg-gradient-to-b from-rose-50 to-orange-100/80",
    iconClassName: "bg-rose-100 text-rose-700",
  },
  glass: {
    name: "玻璃",
    icon: "🔷",
    tier: "component",
    tileClassName: "border-sky-200 bg-gradient-to-b from-sky-50 to-cyan-100/70",
    iconClassName: "bg-sky-100 text-sky-700",
  },
  lime: {
    name: "石灰",
    icon: "⬜",
    tier: "component",
    tileClassName: "border-stone-200 bg-gradient-to-b from-stone-50 to-stone-100/90",
    iconClassName: "bg-stone-100 text-stone-600",
  },
  paper: {
    name: "纸张",
    icon: "📄",
    tier: "component",
    tileClassName: "border-zinc-200 bg-gradient-to-b from-zinc-50 to-slate-100/80",
    iconClassName: "bg-zinc-100 text-zinc-700",
  },
  tallow: {
    name: "油脂",
    icon: "🫧",
    tier: "component",
    tileClassName: "border-yellow-200 bg-gradient-to-b from-yellow-50 to-amber-100/70",
    iconClassName: "bg-yellow-100 text-yellow-700",
  },

  // ── 精制品 (refined_goods) ──
  steel: {
    name: "钢材",
    icon: "🛠",
    tier: "refined_goods",
    tileClassName: "border-slate-400 bg-gradient-to-b from-slate-50 to-slate-200/80",
    iconClassName: "bg-slate-300 text-slate-800",
  },
  bronze: {
    name: "青铜",
    icon: "🔔",
    tier: "refined_goods",
    tileClassName: "border-amber-400 bg-gradient-to-b from-amber-100 to-orange-200/80",
    iconClassName: "bg-amber-300 text-amber-900",
  },
  fine_cloth: {
    name: "锦缎",
    icon: "👘",
    tier: "refined_goods",
    tileClassName: "border-purple-300 bg-gradient-to-b from-purple-50 to-violet-100/80",
    iconClassName: "bg-purple-100 text-purple-700",
  },
  porcelain: {
    name: "瓷器",
    icon: "🏺",
    tier: "refined_goods",
    tileClassName: "border-blue-200 bg-gradient-to-b from-blue-50 to-indigo-100/70",
    iconClassName: "bg-blue-100 text-blue-700",
  },
  ink: {
    name: "墨水",
    icon: "🖋",
    tier: "refined_goods",
    tileClassName: "border-zinc-400 bg-gradient-to-b from-zinc-50 to-zinc-200/80",
    iconClassName: "bg-zinc-700 text-zinc-100",
  },
  plaster: {
    name: "灰泥",
    icon: "🧊",
    tier: "refined_goods",
    tileClassName: "border-stone-300 bg-gradient-to-b from-stone-100 to-stone-200/80",
    iconClassName: "bg-stone-200 text-stone-700",
  },
  candle: {
    name: "蜡烛",
    icon: "🕯",
    tier: "refined_goods",
    tileClassName: "border-yellow-300 bg-gradient-to-b from-yellow-50 to-amber-100/80",
    iconClassName: "bg-yellow-100 text-yellow-700",
  },
  pottery: {
    name: "陶器",
    icon: "🫖",
    tier: "refined_goods",
    tileClassName: "border-orange-300 bg-gradient-to-b from-orange-50 to-red-100/70",
    iconClassName: "bg-orange-100 text-orange-700",
  },

  // ── 成品 (end_product) ──
  furniture: {
    name: "家具",
    icon: "🪑",
    tier: "end_product",
    tileClassName: "border-orange-300 bg-gradient-to-b from-orange-50 to-amber-100/90",
    iconClassName: "bg-orange-200 text-orange-800",
  },
  tools: {
    name: "工具组",
    icon: "🧰",
    tier: "end_product",
    tileClassName: "border-sky-200 bg-gradient-to-b from-sky-50 to-cyan-100/80",
    iconClassName: "bg-sky-100 text-sky-700",
  },
  machine_parts: {
    name: "机器零件",
    icon: "⚙️",
    tier: "end_product",
    tileClassName: "border-indigo-300 bg-gradient-to-b from-indigo-50 to-violet-100/80",
    iconClassName: "bg-indigo-100 text-indigo-700",
  },
  barrel: {
    name: "木桶",
    icon: "🪣",
    tier: "end_product",
    tileClassName: "border-amber-300 bg-gradient-to-b from-amber-50 to-amber-200/80",
    iconClassName: "bg-amber-200 text-amber-800",
  },
  window: {
    name: "玻璃窗",
    icon: "🪟",
    tier: "end_product",
    tileClassName: "border-sky-300 bg-gradient-to-b from-sky-50 to-blue-100/80",
    iconClassName: "bg-sky-100 text-sky-700",
  },
  backpack: {
    name: "背包",
    icon: "🎒",
    tier: "end_product",
    tileClassName: "border-emerald-300 bg-gradient-to-b from-emerald-50 to-green-100/80",
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  armor: {
    name: "铠甲",
    icon: "🛡",
    tier: "end_product",
    tileClassName: "border-slate-400 bg-gradient-to-b from-slate-100 to-slate-300/80",
    iconClassName: "bg-slate-300 text-slate-800",
  },
  saddle: {
    name: "马鞍",
    icon: "🐴",
    tier: "end_product",
    tileClassName: "border-amber-400 bg-gradient-to-b from-amber-100 to-amber-200/80",
    iconClassName: "bg-amber-200 text-amber-800",
  },
  lantern: {
    name: "灯笼",
    icon: "🏮",
    tier: "end_product",
    tileClassName: "border-red-200 bg-gradient-to-b from-red-50 to-orange-100/80",
    iconClassName: "bg-red-100 text-red-700",
  },
  compass: {
    name: "指南针",
    icon: "🧭",
    tier: "end_product",
    tileClassName: "border-teal-300 bg-gradient-to-b from-teal-50 to-cyan-100/80",
    iconClassName: "bg-teal-100 text-teal-700",
  },
  medicine: {
    name: "药品",
    icon: "💊",
    tier: "end_product",
    tileClassName: "border-green-300 bg-gradient-to-b from-green-50 to-emerald-100/80",
    iconClassName: "bg-green-100 text-green-700",
  },
  books: {
    name: "书籍",
    icon: "📚",
    tier: "end_product",
    tileClassName: "border-lime-200 bg-gradient-to-b from-lime-50 to-emerald-100/80",
    iconClassName: "bg-lime-100 text-lime-700",
  },
  reinforced_wall: {
    name: "加固墙材",
    icon: "🏗",
    tier: "end_product",
    tileClassName: "border-neutral-300 bg-gradient-to-b from-neutral-100 to-zinc-200/90",
    iconClassName: "bg-neutral-200 text-neutral-700",
  },
  sculpture: {
    name: "雕塑",
    icon: "🗿",
    tier: "end_product",
    tileClassName: "border-stone-300 bg-gradient-to-b from-stone-50 to-stone-200/90",
    iconClassName: "bg-stone-200 text-stone-800",
  },
  telescope: {
    name: "望远镜",
    icon: "🔭",
    tier: "end_product",
    tileClassName: "border-indigo-300 bg-gradient-to-b from-indigo-50 to-blue-100/80",
    iconClassName: "bg-indigo-100 text-indigo-700",
  },
  clock: {
    name: "钟表",
    icon: "🕰",
    tier: "end_product",
    tileClassName: "border-amber-300 bg-gradient-to-b from-amber-50 to-yellow-100/80",
    iconClassName: "bg-amber-200 text-amber-800",
  },
  land_reclamation_badge: {
    name: "开垦徽章",
    icon: "🏅",
    tier: "end_product",
    tileClassName: "border-yellow-400 bg-gradient-to-b from-yellow-50 to-amber-200/90",
    iconClassName: "bg-yellow-200 text-yellow-800",
  },
};

/** 物品等级到中文标签的映射 */
export const TIER_LABELS: Record<ItemTier, string> = {
  raw_material: "原材料",
  component: "加工件",
  refined_goods: "精制品",
  end_product: "成品",
};

/** 所有物品等级的有序列表 */
export const ALL_TIERS: ItemTier[] = ["raw_material", "component", "refined_goods", "end_product"];

/** 根据 itemKey 获取物品展示信息，未知物品返回默认展示 */
export const getItemDisplay = (itemKey: string): ItemDisplay =>
  itemDisplayByKey[itemKey] ?? {
    name: itemKey,
    icon: "◆",
    tier: "raw_material" as ItemTier,
    tileClassName: "border-slate-200 bg-gradient-to-b from-white to-slate-100",
    iconClassName: "bg-slate-100 text-slate-600",
  };
