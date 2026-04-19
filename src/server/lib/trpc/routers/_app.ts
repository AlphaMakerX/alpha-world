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
});

export type AppRouter = typeof appRouter;
