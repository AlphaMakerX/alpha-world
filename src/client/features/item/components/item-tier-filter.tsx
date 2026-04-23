"use client";

import { ALL_TIERS, TIER_LABELS, type ItemTier } from "@/client/features/item/utils/item-display";

export type FilterOption = "all" | ItemTier;

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "全部" },
  ...ALL_TIERS.map((tier) => ({ value: tier as FilterOption, label: TIER_LABELS[tier] })),
];

type ItemTierFilterProps = {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
  counts?: Record<FilterOption, number>;
};

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
