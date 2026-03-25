import { createTRPCRouter, publicProcedure } from "@/server/lib/trpc/core";
import { listItemDefinitions } from "@/server/features/item";

export const itemRouter = createTRPCRouter({
  definitions: publicProcedure.query(() => listItemDefinitions()),
});
