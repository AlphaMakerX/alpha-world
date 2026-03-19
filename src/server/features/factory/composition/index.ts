import { z } from "zod";
import { executeListFactoryRecipesUseCase as executeListFactoryRecipesUseCaseImpl } from "@/server/features/recipe/application";
import {
  executeListFactoryOrdersUseCase as executeListFactoryOrdersUseCaseImpl,
  type ListFactoryOrdersResult,
} from "@/server/features/factory/application/list-factory-orders-use-case";
import {
  executeStartFactoryProductionUseCase as executeStartFactoryProductionUseCaseImpl,
  type StartFactoryProductionResult,
} from "@/server/features/factory/application/start-factory-production-use-case";
import { factoryProductionJobRepository } from "@/server/features/factory/infrastructure";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { inventoryRepository } from "@/server/features/inventory/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { transactionLedgerRepository, userRepository, systemAccountService } from "@/server/features/person/infrastructure";
import { transact } from "@/server/lib/db";

export const listFactoryOrdersSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
});

export const startFactoryProductionSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  recipeId: z.string().trim().min(1, "配方 ID 不能为空"),
  quantity: z.number().int().min(1).max(100, "制造数量不能超过 100").default(1),
});

export async function executeListFactoryRecipesUseCase() {
  return executeListFactoryRecipesUseCaseImpl();
}

export async function executeListFactoryOrdersUseCase(input: unknown): Promise<ListFactoryOrdersResult> {
  const parsed = listFactoryOrdersSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeListFactoryOrdersUseCaseImpl(parsed.data, {
    factoryProductionJobRepository,
    buildingRepository,
    inventoryRepository,
    plotRepository,
  });
}

export async function executeStartFactoryProductionUseCase(input: unknown): Promise<StartFactoryProductionResult> {
  const parsed = startFactoryProductionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeStartFactoryProductionUseCaseImpl(parsed.data, {
    factoryProductionJobRepository,
    buildingRepository,
    inventoryRepository,
    plotRepository,
    userRepository,
    transactionLedgerRepository,
    systemAccountService,
    transact,
  });
}
