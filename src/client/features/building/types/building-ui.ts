/**
 * 建筑相关的 UI 类型定义
 * 从 tRPC 路由的输入/输出类型中推导出前端所需的建筑、库存、商店、收购站等类型。
 */

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

/** 建筑类型枚举（从建造接口的输入类型推导） */
export type BuildingType = RouterInputs["building"]["build"]["buildingType"];
/** 背包物品类型 */
export type InventoryItem = RouterOutputs["inventory"]["mine"]["items"][number];
/** 商店上架商品类型 */
export type ShopListing = RouterOutputs["shop"]["listings"]["listings"][number];
/** 收购站收购订单类型 */
export type BuyOrder = RouterOutputs["purchasingStation"]["buyOrders"]["orders"][number];
/** 商店交易记录类型 */
export type ShopTransaction = RouterOutputs["shop"]["transactionHistory"]["transactions"][number];
/** 收购站交易记录类型 */
export type PurchasingStationTransaction =
  RouterOutputs["purchasingStation"]["transactionHistory"]["transactions"][number];
