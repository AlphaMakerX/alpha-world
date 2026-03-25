import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type BuildingType = RouterInputs["building"]["build"]["buildingType"];
export type InventoryItem = RouterOutputs["inventory"]["mine"]["items"][number];
export type ShopListing = RouterOutputs["shop"]["listings"]["listings"][number];
export type BuyOrder = RouterOutputs["purchasingStation"]["buyOrders"]["orders"][number];
export type ShopTransaction = RouterOutputs["shop"]["transactionHistory"]["transactions"][number];
export type PurchasingStationTransaction =
  RouterOutputs["purchasingStation"]["transactionHistory"]["transactions"][number];
