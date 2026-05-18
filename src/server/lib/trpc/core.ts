/**
 * tRPC 核心初始化与过程定义
 *
 * - 初始化 tRPC 实例，配置 superjson 序列化器
 * - 定义请求上下文类型（TRPCContext）
 * - 导出公开过程（publicProcedure）和受保护过程（protectedProcedure）
 */

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import type { UserRole } from "@/server/features/person/domain/entities/user";

/** tRPC 请求上下文，由 createContext 在每次请求时构造 */
export type TRPCContext = {
  session: Session | null;
  userId: string | null;
  userRole: UserRole | null;
  // 调用方携带了 Authorization 头但 Bearer 无法解析或不命中。
  // 仅在 userId 为空时影响 protectedProcedure 的错误文案，便于脚本区分
  // "未登录" 与 "令牌无效/已失效"。
  tokenPresentButInvalid: boolean;
};

/** 初始化 tRPC 实例，使用 superjson 支持 Date、Map 等复杂类型的序列化 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

/** 创建 tRPC 路由 */
export const createTRPCRouter = t.router;

/** 公开过程：无需认证即可调用 */
export const publicProcedure = t.procedure;

/** 认证中间件：校验用户是否已登录，未登录则抛出 UNAUTHORIZED 错误 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    // 根据是否携带了无效令牌，返回不同的错误提示
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ctx.tokenPresentButInvalid ? "API 令牌无效或已失效" : "请先登录",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/** 受保护过程：需要用户认证后才能调用，ctx 中保证 userId 非空 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/** 管理员中间件：校验用户是否为管理员，非管理员则抛出 FORBIDDEN 错误 */
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ctx.tokenPresentButInvalid ? "API 令牌无效或已失效" : "请先登录",
    });
  }

  if (ctx.userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "需要管理员权限",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/** 管理员过程：需要管理员权限才能调用 */
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
