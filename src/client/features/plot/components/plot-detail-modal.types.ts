/**
 * 地块详情模态框的类型定义
 * 定义 PlotDetailModal 组件所需的全部 Props 类型。
 */

import type { BuildingType } from "@/client/features/building/types/building-ui";
import type {
  FactoryActionProps,
  ShopActionProps,
  PurchasingStationActionProps,
  ResidentialActionProps,
} from "@/client/features/building/components/building-action-section";
import type { Plot } from "@/client/features/plot/types/plot-ui";

/** 地块详情模态框的 Props 类型 */
export type PlotDetailModalProps = {
  selectedPlotId: string | null;
  selectedPlot?: Plot;
  currentUserId?: string;
  purchaseLoading: boolean;
  buildLoading: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onBuild: (buildingType: BuildingType, factorySubtype?: string) => void;
  factory: FactoryActionProps;
  shop: ShopActionProps;
  purchasingStation: PurchasingStationActionProps;
  residential: ResidentialActionProps;
};
