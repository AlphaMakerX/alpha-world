/**
 * 系统初始化模块的组合根（Composition Root）
 *
 * 负责组装基础设施依赖并对外暴露可直接调用的系统初始化用例。
 * 包含输入校验逻辑（使用 Zod）。
 */

import { z } from "zod";
import {
  executeInitializeSystemUseCase as executeInitializeSystemUseCaseImpl,
  type InitializeSystemResult,
} from "@/server/features/system-initialization/application/initialize-system-use-case";
import { passwordHasher } from "@/server/features/auth/infrastructure";
import { systemAccountService, userRepository } from "@/server/features/person/infrastructure";
import { financeService } from "@/server/features/finance";
import { systemInitializationRepository } from "@/server/features/system-initialization/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { buyOrderRepository } from "@/server/features/purchasing-station/infrastructure";
import { transact } from "@/server/lib/db";

/** 系统初始化接口的输入校验 schema */
const initializeSystemSchema = z.object({
  step: z
    .enum([
      "all",
      "adam",
      "bot1-manager",
      "plot",
      "bot1-manager-plot-purchase",
      "bot1-manager-purchasing-station-build",
      "bot1-manager-buy-orders",
    ])
    .optional(),
});

/**
 * 执行系统初始化（含输入校验）
 *
 * 对外暴露的入口函数，先校验输入参数，再注入依赖并委托给领域用例执行。
 */
export async function executeInitializeSystemUseCase(input?: unknown): Promise<InitializeSystemResult> {
  const parsed = initializeSystemSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeInitializeSystemUseCaseImpl(parsed.data, {
    userRepository,
    buildingRepository,
    financeService,
    passwordHasher,
    systemAccountService,
    plotRepository,
    buyOrderRepository,
    transact,
    systemInitializationRepository,
  });
}
