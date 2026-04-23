/**
 * tRPC 客户端实例
 * 基于 @trpc/react-query 创建类型安全的 tRPC React Hook，绑定到后端 AppRouter 类型。
 */

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/lib/trpc/routers/_app";

/** tRPC React Hook 实例，提供 useQuery/useMutation 等类型安全的 API 调用方法 */
export const trpc = createTRPCReact<AppRouter>();
