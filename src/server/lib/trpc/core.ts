import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

export type TRPCContext = {
  session: Session | null;
  userId: string | null;
  // 调用方携带了 Authorization 头但 Bearer 无法解析或不命中。
  // 仅在 userId 为空时影响 protectedProcedure 的错误文案，便于脚本区分
  // "未登录" 与 "令牌无效/已失效"。
  tokenPresentButInvalid: boolean;
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
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

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
