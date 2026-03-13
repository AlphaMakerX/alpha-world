import type { Plot } from "@/client/features/plot/types/plot-ui";

export type PlotCapabilities = {
  isOwner: boolean;
  canPurchase: boolean;
  canBuild: boolean;
  hasBuilding: boolean;
};

export function getPlotCapabilities(plot: Plot | null | undefined, currentUserId?: string): PlotCapabilities {
  const isOwner = Boolean(plot && currentUserId && plot.ownerUserId === currentUserId);
  const hasBuilding = Boolean(plot?.building);
  const canPurchase = Boolean(plot?.ownerUserId == null);
  const canBuild = isOwner;

  return {
    isOwner,
    canPurchase,
    canBuild,
    hasBuilding,
  };
}
