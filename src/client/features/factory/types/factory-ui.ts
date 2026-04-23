/**
 * 工厂相关的 UI 类型定义
 * 从 tRPC 路由的输出类型中推导出前端所需的配方、订单等类型。
 */

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type FactoryOrdersResponse = RouterOutputs["factory"]["orders"];

/** 工厂配方类型 */
export type FactoryRecipe = RouterOutputs["factory"]["recipes"]["recipes"][number];
/** 工厂订单类型 */
export type FactoryOrder = FactoryOrdersResponse["historyOrders"][number];
/** 工厂订单状态枚举类型 */
export type FactoryOrderStatus = FactoryOrder["status"];
/** 工厂订单集合（当前制造中订单 + 历史订单列表） */
export type FactoryOrders = Pick<FactoryOrdersResponse, "focusOrder" | "historyOrders">;
