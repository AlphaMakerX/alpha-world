/**
 * 物品等级筛选器组件
 * 提供按物品等级（全部/基础材料/加工品/高级制品）筛选的按钮组。
 */

"use client";

import { ALL_TIERS, TIER_LABELS, type ItemTier } from "@/client/features/item/utils/item-display";

/** 筛选选项类型："all" 表示全部，或具体的物品等级 */
export type FilterOption = "all" | ItemTier;

/** 筛选选项配置列表 */
const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "全部" },
  ...ALL_TIERS.map((tier) => ({ value: tier as FilterOption, label: TIER_LABELS[tier] })),
];

/** 物品等级筛选器组件的 Props */
type ItemTierFilterProps = {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
  counts?: Record<FilterOption, number>;
};

/** 物品等级筛选器组件，渲染按钮组并高亮当前选中项 */
export function ItemTierFilter({ value, onChange, counts }: ItemTierFilterProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            "rounded-md px-2.5 py-1.5 text-xs font-medium transition",
            value === opt.value
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          ].join(" ")}
        >
          {opt.label}
          {counts && counts[opt.value] > 0 ? (
            <span className={[
              "ml-1 text-[10px]",
              value === opt.value ? "text-slate-500" : "text-slate-400",
            ].join(" ")}>
              {counts[opt.value]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
