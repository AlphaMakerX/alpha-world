/**
 * NextAuth.js 路由处理器
 *
 * 作为 Next.js App Router 的 catch-all 路由，处理所有 /api/auth/* 请求，
 * 包括登录、登出、回调、CSRF 等 NextAuth 内置端点。
 */

import NextAuth from "next-auth";
import { authOptions } from "@/server/lib/auth/auth-options";

/** 使用统一的 authOptions 创建 NextAuth 处理函数 */
const handler = NextAuth(authOptions);

// 将同一个 handler 同时导出为 GET 和 POST，以处理 NextAuth 的各类请求
export { handler as GET, handler as POST };
