import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type FactoryOrdersResponse = RouterOutputs["factory"]["orders"];

export type FactoryRecipe = RouterOutputs["factory"]["recipes"]["recipes"][number];
export type FactoryOrder = FactoryOrdersResponse["historyOrders"][number];
export type FactoryOrderStatus = FactoryOrder["status"];
export type FactoryOrders = Pick<FactoryOrdersResponse, "focusOrder" | "historyOrders">;
