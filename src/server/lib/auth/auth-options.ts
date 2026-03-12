import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { executeLoginUserUseCase } from "@/server/features/auth/application";

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "alpha-world-dev-secret",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "用户名密码登录",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
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
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};
