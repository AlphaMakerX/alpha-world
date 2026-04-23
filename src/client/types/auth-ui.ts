/**
 * 认证相关的 UI 类型定义
 * 从 NextAuth 的 SessionContextValue 中提取认证状态类型。
 */

import type { SessionContextValue } from "next-auth/react";

/** 认证状态类型：'loading' | 'authenticated' | 'unauthenticated' */
export type AuthStatus = SessionContextValue["status"];
