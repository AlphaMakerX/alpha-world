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
import { transactionLedgerRepository, userRepository } from "@/server/features/person/infrastructure";

export const purchasePlotSchema = z.object({
  plotId: z.number().int().positive(),
  buyerUserId: z.string().uuid("用户 ID 不合法"),
});

export async function executeListPlotsUseCase() {
  return executeListPlotsUseCaseImpl({
    plotRepository,
    buildingRepository,
    userRepository,
  });
}

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
    transactionLedgerRepository,
    transact,
  });
}
