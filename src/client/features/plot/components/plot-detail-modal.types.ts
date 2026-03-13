import type { BuildingType, FactoryOrders, FactoryRecipe } from "@/client/features/building/types/building-ui";
import type { Plot } from "@/client/features/plot/types/plot-ui";

export type PlotDetailModalProps = {
  selectedPlotId: string | null;
  selectedPlot?: Plot;
  currentUserId?: string;
  factoryRecipes: FactoryRecipe[];
  factoryOrders?: FactoryOrders;
  productionLoading: boolean;
  purchaseLoading: boolean;
  buildLoading: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onBuild: (buildingType: BuildingType) => void;
  onStartProduction: (recipeId: string) => void;
};
