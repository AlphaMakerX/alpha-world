import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { performPlayerAction } from "@/lib/game-store";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const playerId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!playerId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const payload = await request.json();
    const result = await performPlayerAction(playerId, payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "操作失败" },
      { status: 400 },
    );
  }
}

