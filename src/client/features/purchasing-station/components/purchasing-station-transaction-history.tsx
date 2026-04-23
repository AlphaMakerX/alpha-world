"use client";

import { useState } from "react";
import type { PurchasingStationTransaction } from "@/client/features/building/types/building-ui";
import { getItemName } from "@/server/features/item/item-catalog";

type PurchasingStationTransactionHistoryProps = {
  transactions: PurchasingStationTransaction[];
};

function translateDescription(desc: string): string {
  return desc.replace(/: (\w+) x/, (_, key) => `: ${getItemName(key)} x`);
}

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

export function PurchasingStationTransactionHistory({ transactions }: PurchasingStationTransactionHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-sm font-medium text-slate-800">
          交易记录 {transactions.length > 0 ? `(${transactions.length})` : ""}
        </span>
        <span className="text-xs text-slate-400">{expanded ? "收起 ▲" : "展开 ▼"}</span>
      </button>
      {expanded ? (
        <div className="border-t border-slate-200 px-3 py-2.5">
          {transactions.length > 0 ? (
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-700">{tx.sellerUsername}</span>
                    <span className="ml-1.5 text-slate-400">{tx.description ? translateDescription(tx.description) : ""}</span>
                  </div>
                  <div className="shrink-0 pl-3 text-right">
                    <span className="font-medium text-emerald-600">¥{tx.amount.toFixed(2)}</span>
                    <span className="ml-2 text-slate-400">{formatTime(tx.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
              暂无交易记录
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
