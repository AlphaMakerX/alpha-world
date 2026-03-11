import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/session";

export default async function HomePage() {
  const cookieStore = await cookies();
  const target = cookieStore.get(SESSION_COOKIE)?.value ? "/game" : "/login";

  redirect(target);
}

