/**
 * 配方目录（Recipe Catalog）
 * 定义游戏中所有工厂配方的静态数据，包括采购、加工、组装三大类。
 * 每个配方描述了所需的输入物品、产出物品、生产耗时，
 * 以及工厂类型归属、解锁费用、等级要求等元数据。
 */

import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";

/** 配方类别：采购 | 加工 | 组装 */
export type RecipeCategory = "procurement" | "processing" | "assembly";

/** 工厂子类型（与 building 模块共享定义） */
export type FactorySubtype =
  | "mine"
  | "lumber_mill"
  | "textile_mill"
  | "ranch"
  | "apothecary"
  | "waterworks"
  | "smelter"
  | "carpentry"
  | "paper_mill"
  | "assembler";

/** 配方定义：描述一个工厂生产配方的完整信息 */
export type Recipe = {
  id: string;                                    // 配方唯一标识
  name: string;                                  // 配方名称
  category: RecipeCategory;                      // 配方类别
  durationSeconds: number;                       // 生产耗时（秒）
  inputs: ItemStack[];                           // 所需输入物品列表
  outputs: ItemStack[];                          // 产出物品列表
  factorySubtypes: FactorySubtype[] | "*";       // 可用的工厂类型，"*" 表示通用
  unlockCost: number;                            // 解锁费用（金币）
  requiredLevel: number;                         // 所需最低工厂等级
  defaultUnlocked: FactorySubtype[] | boolean;    // 建成后自动解锁：true=所有可用类型, 数组=指定类型, false=不自动解锁
};

/** 全量配方列表 */
const recipes: Recipe[] = [
  // ═══════════════════════════════════════════════════════════════
  // 采购配方 (procurement) — 花钱买入原材料
  // ═══════════════════════════════════════════════════════════════
  {
    id: "buy_wood",
    name: "采购木材",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 80 }],
    outputs: [{ itemKey: "wood", quantity: 8 }],
    factorySubtypes: ["lumber_mill"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: true,
  },
  {
    id: "buy_iron_ore",
    name: "采购铁矿石",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 120 }],
    outputs: [{ itemKey: "iron_ore", quantity: 6 }],
    factorySubtypes: ["mine"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: true,
  },
  {
    id: "buy_copper_ore",
    name: "采购铜矿石",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 100 }],
    outputs: [{ itemKey: "copper_ore", quantity: 5 }],
    factorySubtypes: ["mine"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "buy_coal",
    name: "采购煤炭",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 60 }],
    outputs: [{ itemKey: "coal", quantity: 4 }],
    factorySubtypes: ["mine"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "buy_stone",
    name: "采购石料",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 70 }],
    outputs: [{ itemKey: "stone", quantity: 6 }],
    factorySubtypes: ["mine"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "buy_sand",
    name: "采购沙子",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 45 }],
    outputs: [{ itemKey: "sand", quantity: 6 }],
    factorySubtypes: ["mine"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "buy_clay",
    name: "采购粘土",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 50 }],
    outputs: [{ itemKey: "clay", quantity: 6 }],
    factorySubtypes: ["mine"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "buy_cotton",
    name: "采购棉花",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 100 }],
    outputs: [{ itemKey: "cotton", quantity: 5 }],
    factorySubtypes: ["textile_mill"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: true,
  },
  {
    id: "buy_flax",
    name: "采购亚麻",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 85 }],
    outputs: [{ itemKey: "flax", quantity: 5 }],
    factorySubtypes: ["textile_mill"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "buy_raw_hide",
    name: "采购生皮",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 110 }],
    outputs: [{ itemKey: "raw_hide", quantity: 4 }],
    factorySubtypes: ["ranch"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: true,
  },
  {
    id: "buy_herbs",
    name: "采购草药",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 90 }],
    outputs: [{ itemKey: "herbs", quantity: 4 }],
    factorySubtypes: ["apothecary"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: true,
  },
  {
    id: "buy_water",
    name: "采购水资源",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 40 }],
    outputs: [{ itemKey: "water", quantity: 6 }],
    factorySubtypes: "*",
    unlockCost: 30,
    requiredLevel: 1,
    defaultUnlocked: true,
  },
  {
    id: "buy_animal_fat",
    name: "采购动物油脂",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 70 }],
    outputs: [{ itemKey: "animal_fat", quantity: 4 }],
    factorySubtypes: ["ranch"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "buy_water_bulk",
    name: "批量采水",
    category: "procurement",
    durationSeconds: 10,
    inputs: [{ itemKey: "money", quantity: 60 }],
    outputs: [{ itemKey: "water", quantity: 12 }],
    factorySubtypes: ["waterworks"],
    unlockCost: 50,
    requiredLevel: 1,
    defaultUnlocked: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // 加工配方 (processing) — 将原材料加工为部件 / 精制品
  // ═══════════════════════════════════════════════════════════════

  // ── 木材线 ──
  {
    id: "saw_wood_plank",
    name: "木板加工",
    category: "processing",
    durationSeconds: 30,
    inputs: [
      { itemKey: "money", quantity: 20 },
      { itemKey: "wood", quantity: 2 },
    ],
    outputs: [{ itemKey: "wood_plank", quantity: 1 }],
    factorySubtypes: ["lumber_mill", "carpentry"],
    unlockCost: 100,
    requiredLevel: 1,
    defaultUnlocked: ["carpentry"],
  },
  {
    id: "burn_charcoal",
    name: "烧制木炭",
    category: "processing",
    durationSeconds: 35,
    inputs: [
      { itemKey: "money", quantity: 10 },
      { itemKey: "wood", quantity: 3 },
    ],
    outputs: [{ itemKey: "charcoal", quantity: 2 }],
    factorySubtypes: ["lumber_mill"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "pulp_paper",
    name: "造纸",
    category: "processing",
    durationSeconds: 40,
    inputs: [
      { itemKey: "money", quantity: 20 },
      { itemKey: "wood", quantity: 1 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "paper", quantity: 1 }],
    factorySubtypes: ["paper_mill"],
    unlockCost: 100,
    requiredLevel: 1,
    defaultUnlocked: true,
  },

  // ── 金属线 ──
  {
    id: "smelt_iron_ingot",
    name: "冶炼铁锭",
    category: "processing",
    durationSeconds: 60,
    inputs: [
      { itemKey: "money", quantity: 40 },
      { itemKey: "iron_ore", quantity: 3 },
      { itemKey: "coal", quantity: 1 },
    ],
    outputs: [{ itemKey: "iron_ingot", quantity: 1 }],
    factorySubtypes: ["smelter"],
    unlockCost: 100,
    requiredLevel: 1,
    defaultUnlocked: true,
  },
  {
    id: "smelt_copper_ingot",
    name: "冶炼铜锭",
    category: "processing",
    durationSeconds: 55,
    inputs: [
      { itemKey: "money", quantity: 35 },
      { itemKey: "copper_ore", quantity: 3 },
      { itemKey: "coal", quantity: 1 },
    ],
    outputs: [{ itemKey: "copper_ingot", quantity: 1 }],
    factorySubtypes: ["smelter"],
    unlockCost: 100,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "forge_nails",
    name: "锻造铁钉",
    category: "processing",
    durationSeconds: 25,
    inputs: [
      { itemKey: "money", quantity: 15 },
      { itemKey: "iron_ingot", quantity: 1 },
    ],
    outputs: [{ itemKey: "nails", quantity: 3 }],
    factorySubtypes: ["smelter"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "forge_steel",
    name: "锻造钢材",
    category: "processing",
    durationSeconds: 70,
    inputs: [
      { itemKey: "money", quantity: 50 },
      { itemKey: "iron_ingot", quantity: 2 },
      { itemKey: "charcoal", quantity: 1 },
    ],
    outputs: [{ itemKey: "steel", quantity: 1 }],
    factorySubtypes: ["smelter"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "cast_bronze",
    name: "铸造青铜",
    category: "processing",
    durationSeconds: 65,
    inputs: [
      { itemKey: "money", quantity: 45 },
      { itemKey: "copper_ingot", quantity: 2 },
      { itemKey: "iron_ingot", quantity: 1 },
    ],
    outputs: [{ itemKey: "bronze", quantity: 1 }],
    factorySubtypes: ["smelter"],
    unlockCost: 400,
    requiredLevel: 3,
    defaultUnlocked: false,
  },

  // ── 纺织线 ──
  {
    id: "spin_thread",
    name: "纺丝线",
    category: "processing",
    durationSeconds: 30,
    inputs: [
      { itemKey: "money", quantity: 15 },
      { itemKey: "cotton", quantity: 2 },
    ],
    outputs: [{ itemKey: "thread", quantity: 2 }],
    factorySubtypes: ["textile_mill"],
    unlockCost: 100,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "woven_cloth",
    name: "纺织布料",
    category: "processing",
    durationSeconds: 45,
    inputs: [
      { itemKey: "money", quantity: 30 },
      { itemKey: "cotton", quantity: 2 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "cloth", quantity: 1 }],
    factorySubtypes: ["textile_mill"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "weave_linen",
    name: "纺织亚麻布",
    category: "processing",
    durationSeconds: 45,
    inputs: [
      { itemKey: "money", quantity: 30 },
      { itemKey: "flax", quantity: 2 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "linen", quantity: 1 }],
    factorySubtypes: ["textile_mill"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "twist_rope",
    name: "搓绳",
    category: "processing",
    durationSeconds: 35,
    inputs: [
      { itemKey: "money", quantity: 15 },
      { itemKey: "flax", quantity: 2 },
    ],
    outputs: [{ itemKey: "rope", quantity: 1 }],
    factorySubtypes: ["textile_mill"],
    unlockCost: 100,
    requiredLevel: 1,
    defaultUnlocked: false,
  },
  {
    id: "tan_leather",
    name: "鞣制皮革",
    category: "processing",
    durationSeconds: 50,
    inputs: [
      { itemKey: "money", quantity: 30 },
      { itemKey: "raw_hide", quantity: 2 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "leather", quantity: 1 }],
    factorySubtypes: ["ranch"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "extract_dye",
    name: "提炼染料",
    category: "processing",
    durationSeconds: 40,
    inputs: [
      { itemKey: "money", quantity: 25 },
      { itemKey: "herbs", quantity: 2 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "dye", quantity: 1 }],
    factorySubtypes: ["apothecary"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "weave_fine_cloth",
    name: "织造锦缎",
    category: "processing",
    durationSeconds: 80,
    inputs: [
      { itemKey: "money", quantity: 60 },
      { itemKey: "cloth", quantity: 2 },
      { itemKey: "dye", quantity: 1 },
      { itemKey: "thread", quantity: 2 },
    ],
    outputs: [{ itemKey: "fine_cloth", quantity: 1 }],
    factorySubtypes: ["textile_mill"],
    unlockCost: 400,
    requiredLevel: 3,
    defaultUnlocked: false,
  },

  // ── 土石线 ──
  {
    id: "kiln_brick",
    name: "烧制砖块",
    category: "processing",
    durationSeconds: 55,
    inputs: [
      { itemKey: "money", quantity: 25 },
      { itemKey: "clay", quantity: 2 },
      { itemKey: "coal", quantity: 1 },
    ],
    outputs: [{ itemKey: "brick", quantity: 1 }],
    factorySubtypes: ["mine"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "smelt_glass",
    name: "烧制玻璃",
    category: "processing",
    durationSeconds: 50,
    inputs: [
      { itemKey: "money", quantity: 35 },
      { itemKey: "sand", quantity: 2 },
      { itemKey: "charcoal", quantity: 1 },
    ],
    outputs: [{ itemKey: "glass", quantity: 1 }],
    factorySubtypes: ["mine"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "calcine_lime",
    name: "煅烧石灰",
    category: "processing",
    durationSeconds: 45,
    inputs: [
      { itemKey: "money", quantity: 20 },
      { itemKey: "stone", quantity: 2 },
      { itemKey: "coal", quantity: 1 },
    ],
    outputs: [{ itemKey: "lime", quantity: 1 }],
    factorySubtypes: ["mine"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "fire_pottery",
    name: "烧制陶器",
    category: "processing",
    durationSeconds: 55,
    inputs: [
      { itemKey: "money", quantity: 35 },
      { itemKey: "clay", quantity: 2 },
      { itemKey: "water", quantity: 1 },
      { itemKey: "charcoal", quantity: 1 },
    ],
    outputs: [{ itemKey: "pottery", quantity: 1 }],
    factorySubtypes: ["mine"],
    unlockCost: 400,
    requiredLevel: 3,
    defaultUnlocked: false,
  },
  {
    id: "fire_porcelain",
    name: "烧制瓷器",
    category: "processing",
    durationSeconds: 80,
    inputs: [
      { itemKey: "money", quantity: 55 },
      { itemKey: "clay", quantity: 3 },
      { itemKey: "stone", quantity: 1 },
      { itemKey: "charcoal", quantity: 2 },
    ],
    outputs: [{ itemKey: "porcelain", quantity: 1 }],
    factorySubtypes: ["mine"],
    unlockCost: 400,
    requiredLevel: 3,
    defaultUnlocked: false,
  },
  {
    id: "mix_plaster",
    name: "调配灰泥",
    category: "processing",
    durationSeconds: 40,
    inputs: [
      { itemKey: "money", quantity: 20 },
      { itemKey: "lime", quantity: 1 },
      { itemKey: "sand", quantity: 1 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "plaster", quantity: 1 }],
    factorySubtypes: ["mine"],
    unlockCost: 400,
    requiredLevel: 3,
    defaultUnlocked: false,
  },

  // ── 油脂 / 化学线 ──
  {
    id: "render_tallow",
    name: "熬制油脂",
    category: "processing",
    durationSeconds: 30,
    inputs: [
      { itemKey: "money", quantity: 15 },
      { itemKey: "animal_fat", quantity: 2 },
      { itemKey: "water", quantity: 1 },
    ],
    outputs: [{ itemKey: "tallow", quantity: 2 }],
    factorySubtypes: ["ranch"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "make_candle",
    name: "制作蜡烛",
    category: "processing",
    durationSeconds: 35,
    inputs: [
      { itemKey: "money", quantity: 15 },
      { itemKey: "tallow", quantity: 2 },
      { itemKey: "thread", quantity: 1 },
    ],
    outputs: [{ itemKey: "candle", quantity: 2 }],
    factorySubtypes: ["ranch"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "grind_ink",
    name: "研制墨水",
    category: "processing",
    durationSeconds: 45,
    inputs: [
      { itemKey: "money", quantity: 25 },
      { itemKey: "charcoal", quantity: 1 },
      { itemKey: "water", quantity: 1 },
      { itemKey: "tallow", quantity: 1 },
    ],
    outputs: [{ itemKey: "ink", quantity: 1 }],
    factorySubtypes: ["apothecary", "paper_mill"],
    unlockCost: 200,
    requiredLevel: 2,
    defaultUnlocked: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // 组装配方 (assembly) — 将加工件/精制品组合为成品
  // ═══════════════════════════════════════════════════════════════

  // ── 木工成品 ──
  {
    id: "assemble_furniture",
    name: "组装家具",
    category: "assembly",
    durationSeconds: 120,
    inputs: [
      { itemKey: "money", quantity: 90 },
      { itemKey: "wood_plank", quantity: 3 },
      { itemKey: "cloth", quantity: 1 },
      { itemKey: "nails", quantity: 2 },
    ],
    outputs: [{ itemKey: "furniture", quantity: 1 }],
    factorySubtypes: ["carpentry"],
    unlockCost: 500,
    requiredLevel: 3,
    defaultUnlocked: false,
  },
  {
    id: "assemble_barrel",
    name: "组装木桶",
    category: "assembly",
    durationSeconds: 75,
    inputs: [
      { itemKey: "money", quantity: 55 },
      { itemKey: "wood_plank", quantity: 2 },
      { itemKey: "nails", quantity: 2 },
      { itemKey: "rope", quantity: 1 },
    ],
    outputs: [{ itemKey: "barrel", quantity: 1 }],
    factorySubtypes: ["carpentry"],
    unlockCost: 300,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "assemble_window",
    name: "组装玻璃窗",
    category: "assembly",
    durationSeconds: 85,
    inputs: [
      { itemKey: "money", quantity: 70 },
      { itemKey: "glass", quantity: 2 },
      { itemKey: "wood_plank", quantity: 1 },
      { itemKey: "nails", quantity: 2 },
    ],
    outputs: [{ itemKey: "window", quantity: 1 }],
    factorySubtypes: ["carpentry"],
    unlockCost: 300,
    requiredLevel: 2,
    defaultUnlocked: false,
  },

  // ── 金属成品 ──
  {
    id: "forge_tools",
    name: "打造工具组",
    category: "assembly",
    durationSeconds: 110,
    inputs: [
      { itemKey: "money", quantity: 80 },
      { itemKey: "steel", quantity: 1 },
      { itemKey: "wood_plank", quantity: 1 },
      { itemKey: "leather", quantity: 1 },
    ],
    outputs: [{ itemKey: "tools", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 300,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "assemble_machine_parts",
    name: "装配机器零件",
    category: "assembly",
    durationSeconds: 140,
    inputs: [
      { itemKey: "money", quantity: 120 },
      { itemKey: "steel", quantity: 2 },
      { itemKey: "iron_ingot", quantity: 1 },
      { itemKey: "copper_ingot", quantity: 1 },
    ],
    outputs: [{ itemKey: "machine_parts", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 500,
    requiredLevel: 3,
    defaultUnlocked: false,
  },
  {
    id: "forge_armor",
    name: "锻造铠甲",
    category: "assembly",
    durationSeconds: 160,
    inputs: [
      { itemKey: "money", quantity: 150 },
      { itemKey: "steel", quantity: 2 },
      { itemKey: "leather", quantity: 2 },
      { itemKey: "linen", quantity: 1 },
    ],
    outputs: [{ itemKey: "armor", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 500,
    requiredLevel: 3,
    defaultUnlocked: false,
  },
  {
    id: "assemble_compass",
    name: "组装指南针",
    category: "assembly",
    durationSeconds: 95,
    inputs: [
      { itemKey: "money", quantity: 85 },
      { itemKey: "bronze", quantity: 1 },
      { itemKey: "glass", quantity: 1 },
      { itemKey: "iron_ingot", quantity: 1 },
    ],
    outputs: [{ itemKey: "compass", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 300,
    requiredLevel: 2,
    defaultUnlocked: false,
  },

  // ── 纺织 / 皮革成品 ──
  {
    id: "craft_backpack",
    name: "缝制背包",
    category: "assembly",
    durationSeconds: 100,
    inputs: [
      { itemKey: "money", quantity: 85 },
      { itemKey: "leather", quantity: 2 },
      { itemKey: "cloth", quantity: 1 },
      { itemKey: "rope", quantity: 1 },
    ],
    outputs: [{ itemKey: "backpack", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 300,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "craft_saddle",
    name: "缝制马鞍",
    category: "assembly",
    durationSeconds: 110,
    inputs: [
      { itemKey: "money", quantity: 100 },
      { itemKey: "leather", quantity: 3 },
      { itemKey: "rope", quantity: 1 },
      { itemKey: "iron_ingot", quantity: 1 },
    ],
    outputs: [{ itemKey: "saddle", quantity: 1 }],
    factorySubtypes: ["ranch"],
    unlockCost: 500,
    requiredLevel: 3,
    defaultUnlocked: false,
  },

  // ── 光学 / 精密成品 ──
  {
    id: "assemble_lantern",
    name: "组装灯笼",
    category: "assembly",
    durationSeconds: 80,
    inputs: [
      { itemKey: "money", quantity: 65 },
      { itemKey: "glass", quantity: 1 },
      { itemKey: "copper_ingot", quantity: 1 },
      { itemKey: "candle", quantity: 1 },
    ],
    outputs: [{ itemKey: "lantern", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 300,
    requiredLevel: 2,
    defaultUnlocked: false,
  },
  {
    id: "assemble_telescope",
    name: "组装望远镜",
    category: "assembly",
    durationSeconds: 180,
    inputs: [
      { itemKey: "money", quantity: 200 },
      { itemKey: "glass", quantity: 3 },
      { itemKey: "bronze", quantity: 2 },
      { itemKey: "leather", quantity: 1 },
      { itemKey: "tools", quantity: 1 },
    ],
    outputs: [{ itemKey: "telescope", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 500,
    requiredLevel: 3,
    defaultUnlocked: false,
  },
  {
    id: "assemble_clock",
    name: "组装钟表",
    category: "assembly",
    durationSeconds: 200,
    inputs: [
      { itemKey: "money", quantity: 250 },
      { itemKey: "bronze", quantity: 2 },
      { itemKey: "glass", quantity: 1 },
      { itemKey: "machine_parts", quantity: 1 },
      { itemKey: "tools", quantity: 1 },
    ],
    outputs: [{ itemKey: "clock", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 500,
    requiredLevel: 3,
    defaultUnlocked: false,
  },

  // ── 药学 / 文化成品 ──
  {
    id: "brew_medicine",
    name: "调制药品",
    category: "assembly",
    durationSeconds: 90,
    inputs: [
      { itemKey: "money", quantity: 80 },
      { itemKey: "herbs", quantity: 2 },
      { itemKey: "glass", quantity: 1 },
      { itemKey: "paper", quantity: 1 },
    ],
    outputs: [{ itemKey: "medicine", quantity: 1 }],
    factorySubtypes: ["apothecary"],
    unlockCost: 500,
    requiredLevel: 3,
    defaultUnlocked: false,
  },
  {
    id: "bind_books",
    name: "装订书籍",
    category: "assembly",
    durationSeconds: 90,
    inputs: [
      { itemKey: "money", quantity: 70 },
      { itemKey: "paper", quantity: 3 },
      { itemKey: "leather", quantity: 1 },
      { itemKey: "ink", quantity: 1 },
    ],
    outputs: [{ itemKey: "books", quantity: 1 }],
    factorySubtypes: ["paper_mill"],
    unlockCost: 500,
    requiredLevel: 3,
    defaultUnlocked: false,
  },
  {
    id: "carve_sculpture",
    name: "雕刻雕塑",
    category: "assembly",
    durationSeconds: 130,
    inputs: [
      { itemKey: "money", quantity: 95 },
      { itemKey: "stone", quantity: 3 },
      { itemKey: "tools", quantity: 1 },
    ],
    outputs: [{ itemKey: "sculpture", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 300,
    requiredLevel: 2,
    defaultUnlocked: false,
  },

  // ── 建筑成品 ──
  {
    id: "build_reinforced_wall",
    name: "制作加固墙材",
    category: "assembly",
    durationSeconds: 150,
    inputs: [
      { itemKey: "money", quantity: 130 },
      { itemKey: "brick", quantity: 2 },
      { itemKey: "steel", quantity: 1 },
      { itemKey: "plaster", quantity: 1 },
      { itemKey: "nails", quantity: 3 },
    ],
    outputs: [{ itemKey: "reinforced_wall", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 300,
    requiredLevel: 2,
    defaultUnlocked: false,
  },

  // ── 终极配方 ──
  {
    id: "craft_land_reclamation_badge",
    name: "铸造开垦土地徽章",
    category: "assembly",
    durationSeconds: 600,
    inputs: [
      { itemKey: "money", quantity: 2000 },
      { itemKey: "steel", quantity: 8 },
      { itemKey: "bronze", quantity: 4 },
      { itemKey: "wood_plank", quantity: 16 },
      { itemKey: "brick", quantity: 12 },
      { itemKey: "glass", quantity: 4 },
      { itemKey: "leather", quantity: 6 },
      { itemKey: "fine_cloth", quantity: 3 },
      { itemKey: "porcelain", quantity: 2 },
      { itemKey: "nails", quantity: 10 },
      { itemKey: "rope", quantity: 6 },
      { itemKey: "plaster", quantity: 4 },
      { itemKey: "tools", quantity: 3 },
      { itemKey: "machine_parts", quantity: 2 },
      { itemKey: "reinforced_wall", quantity: 2 },
      { itemKey: "books", quantity: 2 },
      { itemKey: "furniture", quantity: 1 },
      { itemKey: "sculpture", quantity: 1 },
    ],
    outputs: [{ itemKey: "land_reclamation_badge", quantity: 1 }],
    factorySubtypes: ["assembler"],
    unlockCost: 2000,
    requiredLevel: 3,
    defaultUnlocked: false,
  },
];

/** 获取全部配方列表 */
export function listRecipes(): Recipe[] {
  return recipes;
}

/** 根据类别筛选配方 */
export function listRecipesByCategory(category: RecipeCategory): Recipe[] {
  return recipes.filter((recipe) => recipe.category === category);
}

/** 根据配方 ID 查找配方，未找到时返回 null */
export function getRecipeById(recipeId: string): Recipe | null {
  return recipes.find((recipe) => recipe.id === recipeId) ?? null;
}

/** 按工厂子类型筛选可用配方（包含通用配方） */
export function listRecipesByFactorySubtype(subtype: string): Recipe[] {
  return recipes.filter((recipe) => {
    if (recipe.factorySubtypes === "*") return true;
    return recipe.factorySubtypes.includes(subtype as FactorySubtype);
  });
}

/** 按工厂子类型 + 等级筛选可用配方 */
export function listRecipesByFactorySubtypeAndLevel(subtype: string, level: number): Recipe[] {
  return recipes.filter((recipe) => {
    if (recipe.factorySubtypes !== "*" && !recipe.factorySubtypes.includes(subtype as FactorySubtype)) {
      return false;
    }
    return recipe.requiredLevel <= level;
  });
}

/** 获取某工厂类型建成后自动解锁的默认配方 */
export function listDefaultRecipes(subtype: string): Recipe[] {
  return recipes.filter((recipe) => {
    // 先检查该配方是否属于此工厂类型
    if (recipe.factorySubtypes !== "*" && !recipe.factorySubtypes.includes(subtype as FactorySubtype)) {
      return false;
    }
    // 检查是否默认解锁
    if (recipe.defaultUnlocked === true) return true;
    if (recipe.defaultUnlocked === false) return false;
    // 数组形式：检查是否包含当前工厂类型
    return recipe.defaultUnlocked.includes(subtype as FactorySubtype);
  });
}
