/**
 * 收购订单卡片组件
 *
 * 展示单个收购订单的信息（物品图标、名称、数量、单价、总价）。
 * 根据当前用户是否为收购站所有者显示不同操作：
 * - 所有者：显示取消订单按钮
 * - 卖家：显示出售数量选择和出售按钮
 */
import { useState } from "react";
import { Button, InputNumber, Popconfirm } from "antd";
import type { BuyOrder } from "@/client/features/building/types/building-ui";
import { getItemDisplay } from "@/client/features/item/utils/item-display";

/** BuyOrderCard 组件的 props 类型 */
type BuyOrderCardProps = {
  order: BuyOrder;
  isOwner: boolean;
  fulfillLoading: boolean;
  cancelLoading: boolean;
  onFulfill: (orderId: number, quantity: number) => void;
  onCancel: (orderId: number) => void;
};

/** 收购订单卡片，所有者可取消，卖家可选择数量出售 */
export function BuyOrderCard({
  order,
  isOwner,
  fulfillLoading,
  cancelLoading,
  onFulfill,
  onCancel,
}: BuyOrderCardProps) {
  const display = getItemDisplay(order.itemKey);
  const totalPrice = order.unitPrice * order.quantity;
  const [sellQuantity, setSellQuantity] = useState(order.quantity);
  const sellTotal = order.unitPrice * sellQuantity;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:shadow-md">
      <div
        className={[
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg shadow-sm",
          display.iconClassName,
        ].join(" ")}
      >
        {display.icon}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-medium text-slate-800">求购: {display.name}</p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>数量: {order.quantity}</span>
          <span>单价: ¥{order.unitPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-emerald-600">¥{totalPrice.toFixed(2)}</p>
        <div className="mt-1.5">
          {isOwner ? (
            <Popconfirm
              title="确认取消该收购订单？"
              description="取消后预付款将退回你的余额。"
              okText="确认取消"
              cancelText="返回"
              onConfirm={() => onCancel(order.id)}
              disabled={cancelLoading}
            >
              <Button size="small" danger loading={cancelLoading}>
                取消
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title={`确认出售 ${display.name} ×${sellQuantity}？`}
              description={
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">出售数量:</span>
                    <InputNumber
                      size="small"
                      min={1}
                      max={order.quantity}
                      value={sellQuantity}
                      onChange={(v) => setSellQuantity(v ?? 1)}
                      className="w-20"
                    />
                    <span className="text-xs text-slate-400">/ {order.quantity}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    将从你的背包扣除物品，获得 ¥{sellTotal.toFixed(2)}
                  </p>
                </div>
              }
              okText="确认出售"
              cancelText="取消"
              onConfirm={() => onFulfill(order.id, sellQuantity)}
              disabled={fulfillLoading}
            >
              <Button type="primary" size="small" loading={fulfillLoading}>
                出售
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>
    </div>
  );
}
