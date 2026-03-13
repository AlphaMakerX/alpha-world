import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Plot = RouterOutputs["plot"]["list"]["plots"][number];
