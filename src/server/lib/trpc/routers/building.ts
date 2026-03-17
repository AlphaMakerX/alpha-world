import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/lib/trpc/core";
import {
  executeBuildBuildingUseCase,
  executeListMyBuildingsUseCase,
} from "@/server/features/building/application";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";
import { z } from "zod";

export const buildingRouter = createTRPCRouter({
  build: protectedProcedure
    .input(
      z.object({
        plotId: z.number().int().positive(),
        buildingType: z.enum([
          "residential",
          "factory",
          "shop",
          "purchasing_station",
        ]),
      }),
    )
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
