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
import {
  executeBuildBuildingUseCase,
  executeCollectFactoryProductionUseCase,
  executeCreateShopListingUseCase,
  executeListFactoryRecipesUseCase,
  executeListFactoryOrdersUseCase,
  executeListMyBuildingsUseCase,
  executeListMyInventoryUseCase,
  executeStartFactoryProductionUseCase,
} from "@/server/features/building/application";
import { executeGetCurrentUserUseCase } from "@/server/features/person/application";
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
  person: createTRPCRouter({
    me: protectedProcedure.query(async ({ ctx }) => {
      const result = await executeGetCurrentUserUseCase({ userId: ctx.userId });
      if (!result.ok) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: result.error,
        });
      }

      return result;
    }),
  }),
  building: createTRPCRouter({
    build: protectedProcedure
      .input(
        z.object({
          plotId: z.number().int().positive(),
          buildingType: z.enum(["residential", "factory", "shop"]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const result = await executeBuildBuildingUseCase({
          ownerUserId: ctx.userId,
          plotId: input.plotId,
          buildingType: input.buildingType,
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
    myBuildings: protectedProcedure.query(async ({ ctx }) => {
      const result = await executeListMyBuildingsUseCase({
        ownerUserId: ctx.userId,
      });

      if (!result.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      return result;
    }),
    myInventory: protectedProcedure.query(async ({ ctx }) => {
      const result = await executeListMyInventoryUseCase({
        ownerUserId: ctx.userId,
      });
      if (!result.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      return result;
    }),
    factoryRecipes: publicProcedure.query(async () => {
      return executeListFactoryRecipesUseCase();
    }),
    factoryOrders: protectedProcedure
      .input(
        z.object({
          buildingId: z.number().int().positive(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const result = await executeListFactoryOrdersUseCase({
          ownerUserId: ctx.userId,
          buildingId: input.buildingId,
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
    startProduction: protectedProcedure
      .input(
        z.object({
          buildingId: z.number().int().positive(),
          recipeId: z.string().trim().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const result = await executeStartFactoryProductionUseCase({
          ownerUserId: ctx.userId,
          buildingId: input.buildingId,
          recipeId: input.recipeId,
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
    collectProduction: protectedProcedure
      .input(
        z.object({
          jobId: z.number().int().positive(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const result = await executeCollectFactoryProductionUseCase({
          ownerUserId: ctx.userId,
          jobId: input.jobId,
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
    createShopListing: protectedProcedure
      .input(
        z.object({
          buildingId: z.number().int().positive(),
          itemKey: z.string().trim().min(1),
          quantity: z.number().int().positive(),
          unitPrice: z.number().nonnegative(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const result = await executeCreateShopListingUseCase({
          sellerUserId: ctx.userId,
          buildingId: input.buildingId,
          itemKey: input.itemKey,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
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
