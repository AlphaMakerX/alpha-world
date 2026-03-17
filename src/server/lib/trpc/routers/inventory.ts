import { createTRPCRouter, protectedProcedure } from "@/server/lib/trpc/core";
import { executeListMyInventoryUseCase } from "@/server/features/inventory/application";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const inventoryRouter = createTRPCRouter({
  mine: protectedProcedure.query(async ({ ctx }) => {
    return unwrapUseCaseResult(
      await executeListMyInventoryUseCase({ ownerUserId: ctx.userId }),
    );
  }),
});
