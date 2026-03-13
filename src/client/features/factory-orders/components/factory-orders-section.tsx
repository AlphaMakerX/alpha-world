import type { FactoryOrders } from "@/client/features/building/types/building-ui";
import { FactoryOrderDetail } from "./factory-order-detail";
import { FactoryOrderList } from "./factory-order-list";

type FactoryOrdersSectionProps = {
  factoryOrders?: FactoryOrders;
};

export function FactoryOrdersSection({ factoryOrders }: FactoryOrdersSectionProps) {
  return (
    <>
      <FactoryOrderDetail focusOrder={factoryOrders?.focusOrder} />
      <FactoryOrderList historyOrders={factoryOrders?.historyOrders} />
    </>
  );
}
