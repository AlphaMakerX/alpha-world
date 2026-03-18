import { z } from "zod";
import {
  executeGetAdamProfileUseCase as executeGetAdamProfileUseCaseImpl,
  type GetAdamProfileResult,
} from "@/server/features/person/application/get-adam-profile-use-case";
import {
  executeGetPersonaProfileUseCase as executeGetPersonaProfileUseCaseImpl,
  type GetPersonaProfileResult,
} from "@/server/features/person/application/get-persona-profile-use-case";
import {
  executeGetCurrentUserUseCase as executeGetCurrentUserUseCaseImpl,
  type GetCurrentUserResult,
} from "@/server/features/person/application/get-current-user-use-case";
import {
  executeGetWealthLeaderboardUseCase as executeGetWealthLeaderboardUseCaseImpl,
  type GetWealthLeaderboardResult,
} from "@/server/features/person/application/get-wealth-leaderboard-use-case";
import { personQueryRepository, userRepository } from "@/server/features/person/infrastructure";
import { PERSONA_IDS } from "@/server/features/person/domain/personas";

export const getCurrentUserSchema = z.object({
  userId: z.string().uuid("用户 ID 格式不正确"),
});

export const getPersonaProfileSchema = z.object({
  personaId: z.enum(PERSONA_IDS),
});

export async function executeGetCurrentUserUseCase(
  input: unknown,
): Promise<GetCurrentUserResult> {
  const parsed = getCurrentUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "参数校验失败",
      status: 400,
    };
  }

  return executeGetCurrentUserUseCaseImpl(parsed.data, {
    userRepository,
  });
}

export async function executeGetWealthLeaderboardUseCase(): Promise<GetWealthLeaderboardResult> {
  return executeGetWealthLeaderboardUseCaseImpl({
    personQueryRepository,
  });
}

export async function executeGetAdamProfileUseCase(): Promise<GetAdamProfileResult> {
  return executeGetAdamProfileUseCaseImpl({
    personQueryRepository,
  });
}

export async function executeGetPersonaProfileUseCase(
  input: unknown,
): Promise<GetPersonaProfileResult | { ok: false; error: string; status: 400 }> {
  const parsed = getPersonaProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "参数校验失败",
      status: 400,
    };
  }

  return executeGetPersonaProfileUseCaseImpl(parsed.data);
}
