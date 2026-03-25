import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeGetCurrentUserUseCase,
  executeGetWealthLeaderboardUseCase,
  executeGetAdamProfileUseCase,
  executeGetPersonaProfileUseCase,
  executeUpdateUserPositionUseCase,
  getPersonaProfileSchema,
  updateUserPositionSchema,
} from "@/server/features/person/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const personRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return unwrapUseCaseResult(
      await executeGetCurrentUserUseCase({ userId: ctx.userId }),
    );
  }),
  updatePosition: protectedProcedure
    .input(updateUserPositionSchema.omit({ userId: true }))
    .mutation(async ({ input, ctx }) => {
      return unwrapUseCaseResult(
        await executeUpdateUserPositionUseCase({
          userId: ctx.userId,
          position: input.position,
        }),
      );
    }),
  wealthLeaderboard: publicProcedure.query(() =>
    executeGetWealthLeaderboardUseCase(),
  ),
  adamProfile: publicProcedure.query(() => executeGetAdamProfileUseCase()),
  personaProfile: publicProcedure
    .input(getPersonaProfileSchema)
    .query(async ({ input }) => {
      return unwrapUseCaseResult(
        await executeGetPersonaProfileUseCase(input),
      );
    }),
});
