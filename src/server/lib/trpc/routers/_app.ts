import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/lib/trpc/core";
import { executeRegisterUserUseCase } from "@/server/features/auth/application";
import {
  executeListPlotsUseCase,
  executePurchasePlotUseCase,
} from "@/server/features/plot/application";
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
  plot: createTRPCRouter({
    list: publicProcedure.query(async () => {
      return executeListPlotsUseCase();
    }),
    purchase: protectedProcedure
      .input(
        z.object({
          plotId: z.number().int().positive(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const result = await executePurchasePlotUseCase({
          plotId: input.plotId,
          buyerUserId: ctx.userId,
        });

        if (!result.ok) {
          if (result.status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: result.error,
            });
          }

          throw new TRPCError({
            code: result.status === 409 ? "CONFLICT" : "BAD_REQUEST",
            message: result.error,
          });
        }

        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
