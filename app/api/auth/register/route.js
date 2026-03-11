import { NextResponse } from "next/server";

import { registerPlayer } from "@/lib/game-store";
import { SESSION_COOKIE, createSessionCookieOptions } from "@/lib/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const player = await registerPlayer(body);
    const response = NextResponse.json({ playerId: player.id });

    response.cookies.set(
      SESSION_COOKIE,
      player.id,
      createSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "注册失败" },
      { status: 400 },
    );
  }
}

