/**
 * tRPC 根路由器定义文件
 *
 * 将所有子路由器（auth、plot、building 等）聚合为一个统一的应用路由器，
 * 并导出 AppRouter 类型供客户端进行端到端类型推断。
 */

import { createTRPCRouter } from "@/server/lib/trpc/core";
import { authRouter } from "./auth";
import { apiAccessTokenRouter } from "./api-access-token";
import { plotRouter } from "./plot";
import { personRouter } from "./person";
import { buildingRouter } from "./building";
import { inventoryRouter } from "./inventory";
import { factoryRouter } from "./factory";
import { shopRouter } from "./shop";
import { purchasingStationRouter } from "./purchasing-station";
import { itemRouter } from "./item";
import { residentialRouter } from "./residential";
import { financeRouter } from "./finance";

/** 应用根路由器，聚合所有业务子路由器 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  apiAccessToken: apiAccessTokenRouter,
  plot: plotRouter,
  person: personRouter,
  building: buildingRouter,
  inventory: inventoryRouter,
  factory: factoryRouter,
  shop: shopRouter,
  purchasingStation: purchasingStationRouter,
  item: itemRouter,
  residential: residentialRouter,
  finance: financeRouter,
});

/** 应用路由器类型，供 tRPC 客户端进行端到端类型推断 */
export type AppRouter = typeof appRouter;
