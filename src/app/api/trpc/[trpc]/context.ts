/**
 * tRPC 上下文创建器
 *
 * 为每个 tRPC 请求构建上下文对象，包含用户身份信息。
 * 支持两种鉴权方式：NextAuth Session 和 Bearer Token（API 访问令牌），
 * 其中 Bearer Token 优先级高于 Session。
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth/auth-options";
import { resolveUserIdFromBearer } from "@/server/features/api-access-token/composition";
import type { TRPCContext } from "@/server/lib/trpc/core";

/**
 * 根据请求创建 tRPC 上下文
 * 并行解析 Session 和 Bearer Token 以降低延迟
 */
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

/** 判断 Authorization 请求头是否存在且非空 */
function isAuthHeaderPresent(header: string | null): boolean {
  return Boolean(header && header.trim().length > 0);
}
