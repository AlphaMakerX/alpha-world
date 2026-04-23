/**
 * tRPC HTTP 路由处理器
 *
 * 使用 @trpc/server 的 fetch 适配器将 tRPC 路由挂载到 /api/trpc 端点，
 * 同时支持 GET（query）和 POST（mutation）请求。
 */

import { appRouter } from "@/server/lib/trpc/routers/_app";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTrpcContext } from "./context";

/** 将请求委托给 tRPC fetch 适配器处理 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTrpcContext({ req }),
  });

// 同时导出 GET 和 POST 以支持 tRPC 的 query 和 mutation 请求
export { handler as GET, handler as POST };
