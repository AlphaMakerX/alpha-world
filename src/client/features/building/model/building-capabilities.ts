import type { Plot } from "@/client/features/plot/types/plot-ui";

export type BuildingCapabilities = {
  isFactory: boolean;
  canManageFactory: boolean;
  isShop: boolean;
  canManageShop: boolean;
  canBrowseShop: boolean;
};

export function getBuildingCapabilities(building: Plot["building"] | null | undefined, isOwner: boolean): BuildingCapabilities {
  const isFactory = building?.type === "factory";
  const canManageFactory = Boolean(isFactory && isOwner);
  const isShop = building?.type === "shop";
  const canManageShop = Boolean(isShop && isOwner);
  const canBrowseShop = Boolean(isShop && !isOwner);

  return {
    isFactory,
    canManageFactory,
    isShop,
    canManageShop,
    canBrowseShop,
  };
}
