/**
 * NextAuth 认证配置
 *
 * 配置 NextAuth.js 的认证策略，使用 JWT 会话模式 + 用户名密码凭据登录。
 * authorize 回调中调用登录用例完成身份验证。
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { executeLoginUserUseCase } from "@/server/features/auth/composition";

export const authOptions: NextAuthOptions = {
  // 优先使用环境变量中的密钥，开发环境回退到硬编码值
  secret:
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "alpha-world-dev-secret",
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "用户名密码登录",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      /** 凭据认证回调：调用登录用例验证用户名密码 */
      async authorize(credentials) {
        const result = await executeLoginUserUseCase(credentials);
        if (!result.ok) {
          return null;
        }

        return {
          id: result.user.id,
          name: result.user.username,
        };
      },
    }),
  ],
  callbacks: {
    /** 将 JWT 中的用户 ID（token.sub）写入 session，供客户端访问 */
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};
