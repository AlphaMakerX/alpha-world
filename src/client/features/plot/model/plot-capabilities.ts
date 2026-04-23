/**
 * 地块能力模型
 * 根据地块数据和当前用户，计算用户对该地块可执行的操作权限。
 */

import type { Plot } from "@/client/features/plot/types/plot-ui";

/** 地块能力标志集合，描述用户对该地块可执行的操作 */
export type PlotCapabilities = {
  isOwner: boolean;
  canPurchase: boolean;
  canBuild: boolean;
  hasBuilding: boolean;
};

/**
 * 计算地块能力
 * @param plot - 地块数据，可能为 null
 * @param currentUserId - 当前登录用户的 ID
 * @returns 地块能力标志集合
 */
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
