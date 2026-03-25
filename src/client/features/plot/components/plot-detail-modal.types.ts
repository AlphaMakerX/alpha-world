import type { BuildingType } from "@/client/features/building/types/building-ui";
import type {
  FactoryActionProps,
  ShopActionProps,
  PurchasingStationActionProps,
} from "@/client/features/building/components/building-action-section";
import type { Plot } from "@/client/features/plot/types/plot-ui";

export type PlotDetailModalProps = {
  selectedPlotId: string | null;
  selectedPlot?: Plot;
  currentUserId?: string;
  purchaseLoading: boolean;
  buildLoading: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onBuild: (buildingType: BuildingType) => void;
  factory: FactoryActionProps;
  shop: ShopActionProps;
  purchasingStation: PurchasingStationActionProps;
};
