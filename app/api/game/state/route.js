import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getGameStateForPlayer } from "@/lib/game-store";
import { SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const playerId = cookieStore.get(SESSION_COOKIE)?.value ?? null;
    const state = await getGameStateForPlayer(playerId);

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "无法加载游戏状态" },
      { status: 400 },
    );
  }
}

