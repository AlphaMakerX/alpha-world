/**
 * Plot 模块组合根
 *
 * 负责组装地块相关用例与基础设施依赖，对外暴露带参数校验的用例入口函数。
 */
import { z } from "zod";
import { buildingRepository } from "@/server/features/building/infrastructure";
import {
  executeListPlotsUseCase as executeListPlotsUseCaseImpl,
} from "@/server/features/plot/application/list-plots-use-case";
import {
  executePurchasePlotUseCase as executePurchasePlotUseCaseImpl,
  type PurchasePlotResult,
} from "@/server/features/plot/application/purchase-plot-use-case";
import { transact } from "@/server/lib/db";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { userRepository, systemAccountService } from "@/server/features/person/infrastructure";
import { financeService } from "@/server/features/finance";

/** 购买地块的入参校验 Schema */
export const purchasePlotSchema = z.object({
  plotId: z.number().int().positive(),
  buyerUserId: z.string().uuid("用户 ID 不合法"),
});

/** 查询所有地块列表 */
export async function executeListPlotsUseCase() {
  return executeListPlotsUseCaseImpl({
    plotRepository,
    buildingRepository,
    userRepository,
  });
}

/** 购买地块（带输入校验） */
export async function executePurchasePlotUseCase(input: unknown): Promise<PurchasePlotResult> {
  const parsed = purchasePlotSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executePurchasePlotUseCaseImpl(parsed.data, {
    plotRepository,
    userRepository,
    financeService,
    systemAccountService,
    transact,
  });
}
