import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import {
  executeGetCurrentUserUseCase,
  executeGetWealthLeaderboardUseCase,
  executeGetAdamProfileUseCase,
} from "@/server/features/person/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const personRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return unwrapUseCaseResult(
      await executeGetCurrentUserUseCase({ userId: ctx.userId }),
    );
  }),
  wealthLeaderboard: publicProcedure.query(() =>
    executeGetWealthLeaderboardUseCase(),
  ),
  adamProfile: publicProcedure.query(() => executeGetAdamProfileUseCase()),
});
