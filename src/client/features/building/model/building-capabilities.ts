import type { Plot } from "@/client/features/plot/types/plot-ui";

export type BuildingCapabilities = {
  isFactory: boolean;
  canManageFactory: boolean;
  isShop: boolean;
  canManageShop: boolean;
  canBrowseShop: boolean;
  isPurchasingStation: boolean;
  canManagePurchasingStation: boolean;
  canBrowsePurchasingStation: boolean;
};

export function getBuildingCapabilities(building: Plot["building"] | null | undefined, isOwner: boolean): BuildingCapabilities {
  const isFactory = building?.type === "factory";
  const canManageFactory = Boolean(isFactory && isOwner);
  const isShop = building?.type === "shop";
  const canManageShop = Boolean(isShop && isOwner);
  const canBrowseShop = Boolean(isShop && !isOwner);
  const isPurchasingStation = building?.type === "purchasing_station";
  const canManagePurchasingStation = Boolean(isPurchasingStation && isOwner);
  const canBrowsePurchasingStation = Boolean(isPurchasingStation && !isOwner);

  return {
    isFactory,
    canManageFactory,
    isShop,
    canManageShop,
    canBrowseShop,
    isPurchasingStation,
    canManagePurchasingStation,
    canBrowsePurchasingStation,
  };
}
