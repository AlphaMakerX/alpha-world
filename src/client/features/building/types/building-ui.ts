import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;
type FactoryOrdersResponse = RouterOutputs["building"]["factoryOrders"];

export type BuildingType = RouterInputs["building"]["build"]["buildingType"];
export type FactoryRecipe = RouterOutputs["building"]["factoryRecipes"]["recipes"][number];
export type FactoryOrder = FactoryOrdersResponse["historyOrders"][number];
export type FactoryOrderStatus = FactoryOrder["status"];
export type FactoryOrders = Pick<FactoryOrdersResponse, "focusOrder" | "historyOrders">;
export type InventoryItem = RouterOutputs["building"]["myInventory"]["items"][number];
