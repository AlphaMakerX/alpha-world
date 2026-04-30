/**
 * 建筑能力模型
 * 根据建筑类型和用户是否为地块所有者，计算用户对该建筑的操作权限。
 */

import type { Plot } from "@/client/features/plot/types/plot-ui";

/** 建筑能力标志集合，描述用户对该建筑可执行的操作 */
export type BuildingCapabilities = {
  isFactory: boolean;
  canManageFactory: boolean;
  isShop: boolean;
  canManageShop: boolean;
  canBrowseShop: boolean;
  isPurchasingStation: boolean;
  canManagePurchasingStation: boolean;
  canBrowsePurchasingStation: boolean;
  isResidential: boolean;
  canManageResidential: boolean;
  canUseResidential: boolean;
};

/**
 * 计算建筑能力
 * @param building - 建筑数据，可能为 null
 * @param isOwner - 当前用户是否为地块所有者
 * @returns 建筑能力标志集合
 */
export function getBuildingCapabilities(building: Plot["building"] | null | undefined, isOwner: boolean): BuildingCapabilities {
  const isFactory = building?.type === "factory";
  const canManageFactory = Boolean(isFactory && isOwner);
  const isShop = building?.type === "shop";
  const canManageShop = Boolean(isShop && isOwner);
  const canBrowseShop = Boolean(isShop && !isOwner);
  const isPurchasingStation = building?.type === "purchasing_station";
  const canManagePurchasingStation = Boolean(isPurchasingStation && isOwner);
  const canBrowsePurchasingStation = Boolean(isPurchasingStation && !isOwner);
  const isResidential = building?.type === "residential";
  const canManageResidential = Boolean(isResidential && isOwner);
  const canUseResidential = Boolean(isResidential);

  return {
    isFactory,
    canManageFactory,
    isShop,
    canManageShop,
    canBrowseShop,
    isPurchasingStation,
    canManagePurchasingStation,
    canBrowsePurchasingStation,
    isResidential,
    canManageResidential,
    canUseResidential,
  };
}
