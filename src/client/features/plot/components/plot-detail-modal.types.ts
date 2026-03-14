import type { BuildingType, FactoryOrders, FactoryRecipe, InventoryItem, ShopListing } from "@/client/features/building/types/building-ui";
import type { Plot } from "@/client/features/plot/types/plot-ui";

export type PlotDetailModalProps = {
  selectedPlotId: string | null;
  selectedPlot?: Plot;
  currentUserId?: string;
  factoryRecipes: FactoryRecipe[];
  factoryOrders?: FactoryOrders;
  shopListings: ShopListing[];
  inventoryItems: InventoryItem[];
  productionLoading: boolean;
  purchaseLoading: boolean;
  buildLoading: boolean;
  createListingLoading: boolean;
  purchaseListingLoading: boolean;
  cancelListingLoading: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onBuild: (buildingType: BuildingType) => void;
  onStartProduction: (recipeId: string) => void;
  onCreateListing: (itemKey: string, quantity: number, unitPrice: number) => void;
  onPurchaseListing: (listingId: number) => void;
  onCancelListing: (listingId: number) => void;
};
