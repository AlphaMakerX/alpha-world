import type { Plot } from "@/client/features/plot/types/plot-ui";
import type { BuildingCapabilities } from "@/client/features/building/model/building-capabilities";
import type { FactoryOrders, FactoryRecipe } from "@/client/features/factory/types/factory-ui";
import type {
  BuyOrder,
  InventoryItem,
  PurchasingStationTransaction,
  ShopListing,
  ShopTransaction,
} from "@/client/features/building/types/building-ui";
import { FactorySection } from "@/client/features/factory/components/factory-section";
import { ShopSection } from "@/client/features/shop/components/shop-section";
import { ShopTransactionHistory } from "@/client/features/shop/components/shop-transaction-history";
import { PurchasingStationSection } from "@/client/features/purchasing-station/components/purchasing-station-section";
import { PurchasingStationTransactionHistory } from "@/client/features/purchasing-station/components/purchasing-station-transaction-history";

export type FactoryActionProps = {
  recipes: FactoryRecipe[];
  orders?: FactoryOrders;
  inventoryItems: InventoryItem[];
  productionLoading: boolean;
  onStartProduction: (recipeId: string, quantity: number) => void;
};

export type ShopActionProps = {
  listings: ShopListing[];
  inventoryItems: InventoryItem[];
  transactions: ShopTransaction[];
  createListingLoading: boolean;
  purchaseLoading: boolean;
  cancelLoading: boolean;
  onCreateListing: (itemKey: string, quantity: number, unitPrice: number) => void;
  onPurchase: (listingId: number, quantity: number) => void;
  onCancel: (listingId: number) => void;
};

export type PurchasingStationActionProps = {
  orders: BuyOrder[];
  transactions: PurchasingStationTransaction[];
  createOrderLoading: boolean;
  fulfillLoading: boolean;
  cancelLoading: boolean;
  onCreateOrder: (itemKey: string, quantity: number, unitPrice: number) => void;
  onFulfill: (orderId: number, quantity: number) => void;
  onCancel: (orderId: number) => void;
};

type BuildingActionSectionProps = {
  building: Plot["building"];
  capabilities: BuildingCapabilities;
  factory: FactoryActionProps;
  shop: ShopActionProps;
  purchasingStation: PurchasingStationActionProps;
};

export function BuildingActionSection({
  building,
  capabilities,
  factory,
  shop,
  purchasingStation,
}: BuildingActionSectionProps) {
  const actionContent = capabilities.canManageFactory ? (
    <FactorySection
      factoryRecipes={factory.recipes}
      factoryOrders={factory.orders}
      inventoryItems={factory.inventoryItems}
      productionLoading={factory.productionLoading}
      onStartProduction={factory.onStartProduction}
    />
  ) : capabilities.isShop ? (
    <ShopSection
      isOwner={capabilities.canManageShop}
      listings={shop.listings}
      inventoryItems={shop.inventoryItems}
      createListingLoading={shop.createListingLoading}
      purchaseLoading={shop.purchaseLoading}
      cancelLoading={shop.cancelLoading}
      onCreateListing={shop.onCreateListing}
      onPurchase={shop.onPurchase}
      onCancel={shop.onCancel}
    />
  ) : capabilities.isPurchasingStation ? (
    <PurchasingStationSection
      isOwner={capabilities.canManagePurchasingStation}
      orders={purchasingStation.orders}
      createOrderLoading={purchasingStation.createOrderLoading}
      fulfillLoading={purchasingStation.fulfillLoading}
      cancelLoading={purchasingStation.cancelLoading}
      onCreateOrder={purchasingStation.onCreateOrder}
      onFulfill={purchasingStation.onFulfill}
      onCancel={purchasingStation.onCancel}
    />
  ) : null;

  const transactionHistory = capabilities.isShop ? (
    <ShopTransactionHistory transactions={shop.transactions} />
  ) : capabilities.isPurchasingStation ? (
    <PurchasingStationTransactionHistory transactions={purchasingStation.transactions} />
  ) : null;

  return (
    <>
      <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="font-medium text-slate-800">建筑操作</p>
        {actionContent ? (
          actionContent
        ) : building ? (
          <p className="text-slate-500">当前建筑暂无可用操作</p>
        ) : (
          <p className="text-slate-500">请先建造建筑后再执行建筑操作</p>
        )}
      </div>
      {transactionHistory}
    </>
  );
}
