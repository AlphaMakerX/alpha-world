import { cookies } from "next/headers";

import AuthPage from "@/components/auth-page";
import { SESSION_COOKIE } from "@/lib/session";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const sessionPlayerId = cookieStore.get(SESSION_COOKIE)?.value ?? null;

  return <AuthPage sessionPlayerId={sessionPlayerId} />;
}

