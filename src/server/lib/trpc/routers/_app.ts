import { createTRPCRouter, publicProcedure } from "@/server/lib/trpc/core";
import { executeRegisterUserUseCase } from "@/server/features/auth/application";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const appRouter = createTRPCRouter({
  hello: publicProcedure
    .input(
      z
        .object({
          name: z.string().min(1).optional(),
        })
        .optional(),
    )
    .query(({ input }) => {
      return {
        message: `Hello ${input?.name ?? "Alpha World"}!`,
      };
    }),
  auth: createTRPCRouter({
    register: publicProcedure
      .input(
        z.object({
          username: z.string(),
          password: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await executeRegisterUserUseCase(input);
        if (!result.ok) {
          throw new TRPCError({
            code: result.status === 409 ? "CONFLICT" : "BAD_REQUEST",
            message: result.error,
          });
        }

        return {
          user: result.user,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
