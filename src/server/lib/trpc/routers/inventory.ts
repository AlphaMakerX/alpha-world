import { createTRPCRouter, protectedProcedure } from "@/server/lib/trpc/core";
import {
  executeListMyInventoryUseCase,
  listMyInventorySchema,
} from "@/server/features/inventory/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const inventoryRouter = createTRPCRouter({
  mine: protectedProcedure
    .input(listMyInventorySchema.omit({ ownerUserId: true }).optional())
    .query(async ({ ctx }) => {
      return unwrapUseCaseResult(
        await executeListMyInventoryUseCase({ ownerUserId: ctx.userId }),
      );
    }),
});
