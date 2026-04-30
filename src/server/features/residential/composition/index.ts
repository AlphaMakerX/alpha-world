/**
 * 住宅模块组合根（Composition Root）
 *
 * 负责将住宅相关的应用层用例与基础设施层实现进行组装，
 * 并对外暴露带参数校验的用例入口。
 */
import { z } from "zod";
import {
  executeStartRestUseCase as executeStartRestUseCaseImpl,
} from "@/server/features/residential/application/start-rest-use-case";
import {
  executeCollectRestUseCase as executeCollectRestUseCaseImpl,
} from "@/server/features/residential/application/collect-rest-use-case";
import {
  executeListRestJobsUseCase as executeListRestJobsUseCaseImpl,
} from "@/server/features/residential/application/list-rest-jobs-use-case";
import {
  executeSetRestPriceUseCase as executeSetRestPriceUseCaseImpl,
} from "@/server/features/residential/application/set-rest-price-use-case";
import { restJobRepository } from "@/server/features/residential/infrastructure";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { userRepository, systemAccountService } from "@/server/features/person/infrastructure";
import { financeService } from "@/server/features/finance";
import { transact } from "@/server/lib/db";

/** 发起休息接口的参数校验 Schema */
export const startRestSchema = z.object({
  userId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
});

/** 收取休息接口的参数校验 Schema */
export const collectRestSchema = z.object({
  userId: z.string().uuid("用户 ID 不合法"),
  jobId: z.number().int().positive(),
});

/** 查询休息任务列表接口的参数校验 Schema */
export const listRestJobsSchema = z.object({
  buildingId: z.number().int().positive(),
});

/** 设定休息价格接口的参数校验 Schema */
export const setRestPriceSchema = z.object({
  userId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  price: z.number().min(0, "价格不能为负数").nullable(),
});

/** 发起休息用例入口 */
export async function executeStartRestUseCase(input: unknown) {
  const parsed = startRestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" as const };
  }
  return executeStartRestUseCaseImpl(parsed.data, {
    buildingRepository,
    plotRepository,
    userRepository,
    restJobRepository,
    financeService,
    systemAccountService,
    transact,
  });
}

/** 收取休息用例入口 */
export async function executeCollectRestUseCase(input: unknown) {
  const parsed = collectRestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" as const };
  }
  return executeCollectRestUseCaseImpl(parsed.data, {
    restJobRepository,
    userRepository,
    transact,
  });
}

/** 查询休息任务列表用例入口 */
export async function executeListRestJobsUseCase(input: unknown) {
  const parsed = listRestJobsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" as const };
  }
  return executeListRestJobsUseCaseImpl(parsed.data, {
    buildingRepository,
    restJobRepository,
  });
}

/** 设定休息价格用例入口 */
export async function executeSetRestPriceUseCase(input: unknown) {
  const parsed = setRestPriceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" as const };
  }
  return executeSetRestPriceUseCaseImpl(parsed.data, {
    buildingRepository,
    plotRepository,
  });
}
