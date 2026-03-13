import type { FactoryOrders } from "@/client/features/building/types/building-ui";
import { useState } from "react";
import { FactoryOrderDetail } from "./factory-order-detail";
import { FactoryOrderList } from "./factory-order-list";

type FactoryOrdersSectionProps = {
  factoryOrders?: FactoryOrders;
};

export function FactoryOrdersSection({ factoryOrders }: FactoryOrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<"focus" | "history">("focus");

  const tabs = [
    { key: "focus" as const, label: "制作中订单" },
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
