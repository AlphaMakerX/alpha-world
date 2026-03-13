import type { FactoryOrder } from "@/client/features/building/types/building-ui";
import { factoryOrderStatusLabelByValue, formatDateTime, formatItemStacks } from "./factory-order-display";

type FactoryOrderCardProps = {
  order: FactoryOrder;
  className?: string;
  showCollectedAt?: boolean;
};

export function FactoryOrderCard({ order, className, showCollectedAt = false }: FactoryOrderCardProps) {
  return (
    <div className={className}>
      <p>订单 ID: {order.id}</p>
      <p>配方: {order.recipeId}</p>
      <p>状态: {factoryOrderStatusLabelByValue[order.status]}</p>
      <p>开始时间: {formatDateTime(order.startedAt)}</p>
      <p>完成时间: {formatDateTime(order.finishAt)}</p>
      {showCollectedAt ? <p>收取时间: {formatDateTime(order.collectedAt)}</p> : null}
      <p>投入: {formatItemStacks(order.inputs)}</p>
      <p>产出: {formatItemStacks(order.outputs)}</p>
    </div>
  );
}
