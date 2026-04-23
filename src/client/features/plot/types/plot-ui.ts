/**
 * 地块相关的 UI 类型定义
 * 从 tRPC 路由的输出类型中推导出前端所需的地块类型。
 */

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;

/** 地块类型，包含地块的全部信息（价格、拥有者、建筑等） */
export type Plot = RouterOutputs["plot"]["list"]["plots"][number];
