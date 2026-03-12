import { appRouter } from "@/server/lib/trpc/routers/_app";
import { authOptions } from "@/server/lib/auth/auth-options";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await getServerSession(authOptions);
      const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
      return { session, userId };
    },
  });

export { handler as GET, handler as POST };
