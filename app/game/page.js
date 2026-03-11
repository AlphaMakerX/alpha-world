import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import GameShell from "@/components/game-shell";
import { SESSION_COOKIE } from "@/lib/session";

export default async function GamePage() {
  const cookieStore = await cookies();
  const sessionPlayerId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionPlayerId) {
    redirect("/login");
  }

  return <GameShell />;
}

