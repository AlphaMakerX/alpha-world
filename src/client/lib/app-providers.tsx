/**
 * 全局 Provider 组件
 * 整合 SessionProvider（NextAuth 会话管理）、tRPC Provider 和 React Query Provider，
 * 作为应用的顶层状态管理层。
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SessionProvider } from "next-auth/react";
import superjson from "superjson";
import { useState } from "react";
import { trpc } from "@/client/lib/trpc";

/** 获取当前应用的基础 URL，客户端使用 window.location.origin，服务端回退到 localhost */
function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

/**
 * 全局 Provider 组件
 * 使用 useState 初始化 QueryClient 和 trpcClient 确保每个请求使用独立实例（避免 SSR 数据泄露）。
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
