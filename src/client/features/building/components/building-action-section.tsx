/**
 * 建筑操作区组件
 * 根据建筑类型和用户权限，渲染不同的建筑操作面板（工厂制造、商店交易、收购站）以及交易历史。
 */

import type { Plot } from "@/client/features/plot/types/plot-ui";
import type { BuildingCapabilities } from "@/client/features/building/model/building-capabilities";
import type { FactoryOrders, FactoryRecipe, FactoryUpgradePreview } from "@/client/features/factory/types/factory-ui";
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
import { ResidentialSection } from "@/client/features/residential/components/residential-section";

/** 工厂操作相关的 Props */
export type FactoryActionProps = {
  recipes: FactoryRecipe[];
  recipesLoading: boolean;
  orders?: FactoryOrders;
  inventoryItems: InventoryItem[];
  productionLoading: boolean;
  unlockLoading: boolean;
  upgradeLoading: boolean;
  upgradePreview: FactoryUpgradePreview;
  onStartProduction: (recipeId: string, quantity: number) => void;
  onUnlockRecipe: (recipeId: string) => void;
  onUpgradeFactory: () => void;
};

/** 商店操作相关的 Props */
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

/** 住宅操作相关的 Props */
export type ResidentialActionProps = {
  jobs: Array<{
    id: number;
    buildingId: number;
    ownerUserId: string;
    resterUserId: string;
    restType: string;
    staminaGain: number;
    cost: number;
    status: string;
    startedAt: Date;
    finishAt: Date;
    collectedAt: Date | null;
  }>;
  jobsLoading: boolean;
  restPrice: number | null;
  currentUserId?: string;
  startRestLoading: boolean;
  collectRestLoading: boolean;
  setRestPriceLoading: boolean;
  onStartRest: () => void;
  onCollectRest: (jobId: number) => void;
  onSetRestPrice: (price: number | null) => void;
};

/** 收购站操作相关的 Props */
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

/** 建筑操作区组件的 Props */
type BuildingActionSectionProps = {
  building: Plot["building"];
  capabilities: BuildingCapabilities;
  factory: FactoryActionProps;
  shop: ShopActionProps;
  purchasingStation: PurchasingStationActionProps;
  residential: ResidentialActionProps;
};

/**
 * 建筑操作区组件
 * 根据建筑能力（capabilities）决定渲染工厂/商店/收购站的操作面板和交易历史。
 */
export function BuildingActionSection({
  building,
  capabilities,
  factory,
  shop,
  purchasingStation,
  residential,
}: BuildingActionSectionProps) {
  // 根据建筑能力选择对应的操作面板：工厂 > 商店 > 收购站
  const actionContent = capabilities.canManageFactory ? (
    <FactorySection
      factoryRecipes={factory.recipes}
      recipesLoading={factory.recipesLoading}
      factoryOrders={factory.orders}
      inventoryItems={factory.inventoryItems}
      productionLoading={factory.productionLoading}
      unlockLoading={factory.unlockLoading}
      upgradeLoading={factory.upgradeLoading}
      upgradePreview={factory.upgradePreview}
      onStartProduction={factory.onStartProduction}
      onUnlockRecipe={factory.onUnlockRecipe}
      onUpgradeFactory={factory.onUpgradeFactory}
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
  ) : capabilities.canUseResidential ? (
    <ResidentialSection
      isOwner={capabilities.canManageResidential}
      restPrice={residential.restPrice}
      jobs={residential.jobs}
      jobsLoading={residential.jobsLoading}
      startRestLoading={residential.startRestLoading}
      collectRestLoading={residential.collectRestLoading}
      setRestPriceLoading={residential.setRestPriceLoading}
      currentUserId={residential.currentUserId}
      onStartRest={residential.onStartRest}
      onCollectRest={residential.onCollectRest}
      onSetRestPrice={residential.onSetRestPrice}
    />
  ) : null;

  // 商店或收购站显示对应的交易历史
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
