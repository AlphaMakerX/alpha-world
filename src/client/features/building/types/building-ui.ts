import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type BuildingType = RouterInputs["building"]["build"]["buildingType"];
export type InventoryItem = RouterOutputs["building"]["myInventory"]["items"][number];
export type ShopListing = RouterOutputs["building"]["shopListings"]["listings"][number];
export type BuyOrder = RouterOutputs["building"]["buyOrders"]["orders"][number];
export type ShopTransaction = RouterOutputs["building"]["shopTransactionHistory"]["transactions"][number];
export type PurchasingStationTransaction = RouterOutputs["building"]["purchasingStationTransactionHistory"]["transactions"][number];
