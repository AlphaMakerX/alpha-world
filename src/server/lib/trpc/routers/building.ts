import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/lib/trpc/core";
import {
  executeBuildBuildingUseCase,
  executeListMyBuildingsUseCase,
  buildBuildingSchema,
} from "@/server/features/building/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const buildingRouter = createTRPCRouter({
  build: protectedProcedure
    .input(buildBuildingSchema.omit({ ownerUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeBuildBuildingUseCase({
          ownerUserId: ctx.userId,
          plotId: input.plotId,
          buildingType: input.buildingType,
        }),
      );
    }),
  myBuildings: protectedProcedure.query(async ({ ctx }) => {
    return unwrapUseCaseResult(
      await executeListMyBuildingsUseCase({ ownerUserId: ctx.userId }),
    );
  }),
});
