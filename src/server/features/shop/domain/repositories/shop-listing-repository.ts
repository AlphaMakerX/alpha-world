/**
 * 商店上架商品仓储接口定义
 *
 * 定义了商店商品上架（ShopListing）的领域模型类型和仓储接口，
 * 用于对商店中的上架商品进行增删改查操作。
 */

import type { ItemKey } from "@/server/features/item/item-catalog";

/** 商品上架状态：active-在售 | sold-已售出 | cancelled-已取消 */
export type ShopListingStatus = "active" | "sold" | "cancelled";

/** 商店上架商品的领域模型 */
export type ShopListing = {
  id: number;
  /** 所属建筑 ID */
  buildingId: number;
  /** 卖家用户 ID */
  sellerUserId: string;
  /** 物品标识键 */
  itemKey: ItemKey;
  /** 上架数量 */
  quantity: number;
  /** 单价 */
  unitPrice: number;
  /** 当前状态 */
  status: ShopListingStatus;
  createdAt: Date;
  updatedAt: Date;
};

/** 商店上架商品仓储接口 */
export interface ShopListingRepository {
  /** 创建一条新的上架记录 */
  create(input: Omit<ShopListing, "id" | "createdAt" | "updatedAt">): Promise<ShopListing>;
  /** 根据 ID 查询上架商品 */
  findById(id: number): Promise<ShopListing | null>;
  /** 查询指定建筑下所有在售商品 */
  findActiveByBuildingId(buildingId: number): Promise<ShopListing[]>;
  /** 更新商品状态（如标记为已售出或已取消） */
  updateStatus(id: number, status: ShopListingStatus): Promise<void>;
  /** 更新商品剩余数量（部分购买后） */
  updateQuantity(id: number, quantity: number): Promise<void>;
}
