/**
 * 工厂模块组合根（Composition Root）
 *
 * 负责将工厂相关的应用层用例与基础设施层实现进行组装，
 * 并对外暴露带参数校验的用例入口。
 */
import { z } from "zod";
import {
  executeListFactoryOrdersUseCase as executeListFactoryOrdersUseCaseImpl,
  type ListFactoryOrdersResult,
} from "@/server/features/factory/application/list-factory-orders-use-case";
import {
  executeStartFactoryProductionUseCase as executeStartFactoryProductionUseCaseImpl,
  type StartFactoryProductionResult,
} from "@/server/features/factory/application/start-factory-production-use-case";
import {
  executeUnlockRecipeUseCase as executeUnlockRecipeUseCaseImpl,
  type UnlockRecipeResult,
} from "@/server/features/factory/application/unlock-recipe-use-case";
import {
  executeUpgradeFactoryUseCase as executeUpgradeFactoryUseCaseImpl,
  type UpgradeFactoryResult,
} from "@/server/features/factory/application/upgrade-factory-use-case";
import {
  executeListFactoryRecipesUseCase as executeListFactoryRecipesUseCaseImpl,
  type ListFactoryRecipesResult,
} from "@/server/features/factory/application/list-factory-recipes-use-case";
import { factoryProductionJobRepository } from "@/server/features/factory/infrastructure";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { inventoryRepository } from "@/server/features/inventory/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { transactionLedgerRepository, userRepository, systemAccountService } from "@/server/features/person/infrastructure";
import { unlockedRecipeRepository } from "@/server/features/factory/infrastructure/unlocked-recipe-repository";
import { transact } from "@/server/lib/db";

/** 查询工厂订单接口的参数校验 Schema */
export const listFactoryOrdersSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
});

/** 开始工厂生产接口的参数校验 Schema */
export const startFactoryProductionSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  recipeId: z.string().trim().min(1, "配方 ID 不能为空"),
  quantity: z.number().int().min(1).max(100, "制造数量不能超过 100").default(1),
});

/** 解锁配方接口的参数校验 Schema */
export const unlockRecipeSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  recipeId: z.string().trim().min(1, "配方 ID 不能为空"),
});

/** 升级工厂接口的参数校验 Schema */
export const upgradeFactorySchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
});

/** 查询工厂配方列表接口的参数校验 Schema */
export const listFactoryRecipesSchema = z.object({
  buildingId: z.number().int().positive().optional(),
});

/** 查询工厂配方列表用例入口 */
export async function executeListFactoryRecipesUseCase(input?: unknown): Promise<ListFactoryRecipesResult> {
  const parsed = listFactoryRecipesSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" };
  }
  return executeListFactoryRecipesUseCaseImpl(
    { buildingId: parsed.data.buildingId },
    { buildingRepository, unlockedRecipeRepository },
  );
}

/** 查询工厂订单列表用例入口 */
export async function executeListFactoryOrdersUseCase(input: unknown): Promise<ListFactoryOrdersResult> {
  const parsed = listFactoryOrdersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" };
  }
  return executeListFactoryOrdersUseCaseImpl(parsed.data, {
    factoryProductionJobRepository,
    buildingRepository,
    inventoryRepository,
    plotRepository,
  });
}

/** 开始工厂生产用例入口 */
export async function executeStartFactoryProductionUseCase(input: unknown): Promise<StartFactoryProductionResult> {
  const parsed = startFactoryProductionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" };
  }
  return executeStartFactoryProductionUseCaseImpl(parsed.data, {
    factoryProductionJobRepository,
    buildingRepository,
    inventoryRepository,
    plotRepository,
    userRepository,
    transactionLedgerRepository,
    unlockedRecipeRepository,
    systemAccountService,
    transact,
  });
}

/** 解锁配方用例入口 */
export async function executeUnlockRecipeUseCase(input: unknown): Promise<UnlockRecipeResult> {
  const parsed = unlockRecipeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" };
  }
  return executeUnlockRecipeUseCaseImpl(parsed.data, {
    buildingRepository,
    plotRepository,
    userRepository,
    transactionLedgerRepository,
    unlockedRecipeRepository,
    systemAccountService,
    transact,
  });
}

/** 升级工厂用例入口 */
export async function executeUpgradeFactoryUseCase(input: unknown): Promise<UpgradeFactoryResult> {
  const parsed = upgradeFactorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "参数校验失败", code: "BAD_REQUEST" };
  }
  return executeUpgradeFactoryUseCaseImpl(parsed.data, {
    buildingRepository,
    plotRepository,
    userRepository,
    transactionLedgerRepository,
    systemAccountService,
    transact,
  });
}
