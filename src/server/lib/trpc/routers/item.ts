/**
 * 物品路由器
 *
 * 提供查询物品定义（元数据）的公开接口。
 */

import { createTRPCRouter, publicProcedure } from "@/server/lib/trpc/core";
import { listItemDefinitions } from "@/server/features/item";

export const itemRouter = createTRPCRouter({
  /** 获取所有物品定义信息（名称、描述、tier 等） */
  definitions: publicProcedure.query(() => listItemDefinitions()),
});
