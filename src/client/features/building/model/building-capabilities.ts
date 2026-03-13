import type { Plot } from "@/client/features/plot/types/plot-ui";

export type BuildingCapabilities = {
  isFactory: boolean;
  canManageFactory: boolean;
};

export function getBuildingCapabilities(building: Plot["building"] | null | undefined, isOwner: boolean): BuildingCapabilities {
  const isFactory = building?.type === "factory";
  const canManageFactory = Boolean(isFactory && isOwner);

  return {
    isFactory,
    canManageFactory,
  };
}
