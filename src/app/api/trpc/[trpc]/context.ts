import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth/auth-options";
import { resolveUserIdFromBearer } from "@/server/features/api-access-token/composition";
import type { TRPCContext } from "@/server/lib/trpc/core";

export async function createTrpcContext({
  req,
}: {
  req: Request;
}): Promise<TRPCContext> {
  const authHeader = req.headers.get("authorization");

  // Session 与 Bearer 解析互不依赖，并行降低首字节延迟
  const [session, bearerUserId] = await Promise.all([
    getServerSession(authOptions),
    resolveUserIdFromBearer(authHeader),
  ]);

  const sessionUserId = (session?.user as { id?: string } | undefined)?.id ?? null;
  // Bearer 优先于 Session（设计文档约定的唯一规则）
  const userId = bearerUserId ?? sessionUserId;

  // session 字段只来源于 NextAuth，不因 Bearer 而伪造
  return {
    session,
    userId,
    tokenPresentButInvalid:
      isAuthHeaderPresent(authHeader) && bearerUserId === null,
  };
}

function isAuthHeaderPresent(header: string | null): boolean {
  return Boolean(header && header.trim().length > 0);
}
