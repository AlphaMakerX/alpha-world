import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

type TRPCContext = {
  session: Session | null;
  userId: string | null;
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
      message: "请先登录",
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
