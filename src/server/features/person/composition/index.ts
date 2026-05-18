/**
 * Person 模块组合根
 *
 * 负责组装用例与基础设施依赖，对外暴露带参数校验的用例入口函数。
 * 使用 Zod 进行输入校验，注入具体仓储实现。
 */
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
  executeUpdateUserPositionUseCase as executeUpdateUserPositionUseCaseImpl,
  type UpdateUserPositionResult,
} from "@/server/features/person/application/update-user-position-use-case";
import {
  executeGetWealthLeaderboardUseCase as executeGetWealthLeaderboardUseCaseImpl,
  type GetWealthLeaderboardResult,
} from "@/server/features/person/application/get-wealth-leaderboard-use-case";
import { personQueryRepository, userRepository } from "@/server/features/person/infrastructure";
import { PERSONA_IDS } from "@/server/features/person/domain/personas";
import type { UserRole } from "@/server/features/person/domain/entities/user";

/** 获取当前用户的入参校验 Schema */
export const getCurrentUserSchema = z.object({
  userId: z.string().uuid("用户 ID 格式不正确"),
});

/** 获取角色档案的入参校验 Schema */
export const getPersonaProfileSchema = z.object({
  personaId: z.enum(PERSONA_IDS),
});

/** 更新用户位置的入参校验 Schema（坐标范围 x:0~3200, y:0~1200） */
export const updateUserPositionSchema = z.object({
  userId: z.string().uuid("用户 ID 格式不正确"),
  position: z.object({
    x: z.number().finite().min(0).max(3200),
    y: z.number().finite().min(0).max(1200),
  }),
});

/** 获取当前用户信息（带输入校验） */
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

/** 获取财富排行榜 */
export async function executeGetWealthLeaderboardUseCase(): Promise<GetWealthLeaderboardResult> {
  return executeGetWealthLeaderboardUseCaseImpl({
    personQueryRepository,
  });
}

/** 更新用户位置（带输入校验） */
export async function executeUpdateUserPositionUseCase(
  input: unknown,
): Promise<UpdateUserPositionResult | { ok: false; error: string; status: 400 }> {
  const parsed = updateUserPositionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "参数校验失败",
      status: 400,
    };
  }

  return executeUpdateUserPositionUseCaseImpl(parsed.data, {
    userRepository,
  });
}

/** 根据用户 ID 查询角色，用于 tRPC 上下文注入 */
export async function resolveUserRole(userId: string): Promise<UserRole | null> {
  const user = await userRepository.findById(userId);
  return user?.role ?? null;
}

/** 获取 Adam 资金概况 */
export async function executeGetAdamProfileUseCase(): Promise<GetAdamProfileResult> {
  return executeGetAdamProfileUseCaseImpl({
    personQueryRepository,
  });
}

/** 获取角色档案（带输入校验） */
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
