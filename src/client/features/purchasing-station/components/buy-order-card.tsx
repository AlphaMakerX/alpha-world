import { Button, Popconfirm } from "antd";
import type { BuyOrder } from "@/client/features/building/types/building-ui";
import { getItemDisplay } from "@/client/features/inventory/utils/item-display";

type BuyOrderCardProps = {
  order: BuyOrder;
  isOwner: boolean;
  fulfillLoading: boolean;
  cancelLoading: boolean;
  onFulfill: (orderId: number) => void;
  onCancel: (orderId: number) => void;
};

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
              title={`确认出售 ${display.name} ×${order.quantity}？`}
              description={`将从你的背包扣除物品，获得 ¥${totalPrice.toFixed(2)}。`}
              okText="确认出售"
              cancelText="取消"
              onConfirm={() => onFulfill(order.id)}
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
