import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type FactoryOrdersResponse = RouterOutputs["building"]["factoryOrders"];

export type FactoryRecipe = RouterOutputs["building"]["factoryRecipes"]["recipes"][number];
export type FactoryOrder = FactoryOrdersResponse["historyOrders"][number];
export type FactoryOrderStatus = FactoryOrder["status"];
export type FactoryOrders = Pick<FactoryOrdersResponse, "focusOrder" | "historyOrders">;
