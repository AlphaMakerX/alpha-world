import { createTRPCRouter, publicProcedure } from "@/server/lib/trpc/core";
import {
  executeGenerateApiAccessTokenUseCase,
  generateApiAccessTokenSchema,
} from "@/server/features/api-access-token/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const apiAccessTokenRouter = createTRPCRouter({
  generate: publicProcedure
    .input(generateApiAccessTokenSchema)
    .mutation(async ({ input }) => {
      const { token } = unwrapUseCaseResult(
        await executeGenerateApiAccessTokenUseCase(input),
      );
      return { token };
    }),
});
