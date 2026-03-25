import { createTRPCRouter, publicProcedure } from "@/server/lib/trpc/core";
import {
  executeRegisterUserUseCase,
  registerUserSchema,
} from "@/server/features/auth/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerUserSchema)
    .mutation(async ({ input }) => {
      const { user } = unwrapUseCaseResult(
        await executeRegisterUserUseCase(input),
      );
      return { user };
    }),
});
