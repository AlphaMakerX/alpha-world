/**
 * 工厂订单区组件
 * 包含"制造中订单"和"历史订单"两个 Tab 页，支持切换查看。
 */

import type { FactoryOrders } from "@/client/features/factory/types/factory-ui";
import { useState } from "react";
import { FactoryOrderDetail } from "./factory-order-detail";
import { FactoryOrderList } from "./factory-order-list";

/** 工厂订单区组件的 Props */
type FactoryOrdersSectionProps = {
  factoryOrders?: FactoryOrders;
};

/** 工厂订单区组件，包含"制造中订单"和"历史订单"两个 Tab */
export function FactoryOrdersSection({ factoryOrders }: FactoryOrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<"focus" | "history">("focus");

  const tabs = [
    { key: "focus" as const, label: "制造中订单" },
    { key: "history" as const, label: "历史订单" },
  ];

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-md border border-slate-200 bg-white p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "rounded px-3 py-1.5 text-xs font-medium transition",
                isActive ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-500 hover:bg-slate-100",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "focus" ? (
        <FactoryOrderDetail focusOrder={factoryOrders?.focusOrder} />
      ) : (
        <FactoryOrderList historyOrders={factoryOrders?.historyOrders} />
      )}
    </div>
  );
}
