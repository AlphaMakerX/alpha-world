/**
 * 背包/库存路由器
 *
 * 提供查询当前用户库存物品的接口。
 */

import { createTRPCRouter, protectedProcedure } from "@/server/lib/trpc/core";
import {
  executeListMyInventoryUseCase,
  listMyInventorySchema,
} from "@/server/features/inventory/composition";
import { unwrapUseCaseResult } from "@/server/lib/trpc/utils";

export const inventoryRouter = createTRPCRouter({
  /** 查询当前用户的库存物品列表 */
  mine: protectedProcedure
    .input(listMyInventorySchema.omit({ ownerUserId: true }).optional())
    .query(async ({ ctx }) => {
      return unwrapUseCaseResult(
        await executeListMyInventoryUseCase({ ownerUserId: ctx.userId }),
      );
    }),
});
