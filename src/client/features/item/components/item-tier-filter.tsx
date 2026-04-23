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
};

export function ItemTierFilter({ value, onChange }: ItemTierFilterProps) {
  return (
    <div className="flex gap-1">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            "rounded-md px-2.5 py-1 text-xs font-medium transition",
            value === opt.value
              ? "bg-slate-700 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
