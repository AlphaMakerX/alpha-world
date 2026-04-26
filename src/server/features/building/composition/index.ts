/**
 * 建筑模块组合根（Composition Root）
 *
 * 负责将应用层用例与基础设施层实现进行组装，并对外暴露带参数校验的用例入口。
 * 外部调用方（如 API 路由）应通过本模块调用用例，而非直接调用应用层。
 */
import { z } from "zod";
import {
  executeBuildBuildingUseCase as executeBuildBuildingUseCaseImpl,
  type BuildBuildingResult,
} from "@/server/features/building/application/build-building-use-case";
import {
  executeListMyBuildingsUseCase as executeListMyBuildingsUseCaseImpl,
  type ListMyBuildingsResult,
} from "@/server/features/building/application/list-my-buildings-use-case";
import type { Building } from "@/server/features/building/domain/entities/building";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { userRepository, systemAccountService } from "@/server/features/person/infrastructure";
import { financeService } from "@/server/features/finance";
import { isValidFactorySubtype } from "@/server/features/factory/domain/factory-subtype";
import { autoUnlockDefaultRecipes } from "@/server/features/factory/application/services/auto-unlock-default-recipes";
import { unlockedRecipeRepository } from "@/server/features/factory/infrastructure/unlocked-recipe-repository";
import { transact } from "@/server/lib/db";

/** 建造建筑接口的参数校验 Schema */
export const buildBuildingSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  plotId: z.number().int().positive(),
  buildingType: z.enum(["residential", "factory", "shop", "purchasing_station"]),
  factorySubtype: z.string().optional(),
}).refine(
  (data) => {
    if (data.buildingType === "factory" && data.factorySubtype) {
      return isValidFactorySubtype(data.factorySubtype);
    }
    return true;
  },
  { message: "无效的工厂子类型" },
);

/** 工厂建成时自动解锁默认配方 */
const unlockDefaultRecipes = async (building: Building) => {
  if (building.type !== "factory" || !building.subtype) {
    throw new Error(`unlockDefaultRecipes 只能用于工厂建筑，收到: type=${building.type}, subtype=${building.subtype}`);
  }
  await autoUnlockDefaultRecipes(building.id, building.subtype, unlockedRecipeRepository);
};

/** 查询我的建筑列表接口的参数校验 Schema */
export const listMyBuildingsSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
});

/** 建造建筑用例入口：校验参数后注入依赖并执行 */
export async function executeBuildBuildingUseCase(input: unknown): Promise<BuildBuildingResult> {
  const parsed = buildBuildingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeBuildBuildingUseCaseImpl(parsed.data, {
    buildingRepository,
    plotRepository,
    userRepository,
    financeService,
    systemAccountService,
    transact,
    unlockDefaultRecipes,
  });
}

/** 查询我的建筑列表用例入口：校验参数后注入依赖并执行 */
export async function executeListMyBuildingsUseCase(input: unknown): Promise<ListMyBuildingsResult> {
  const parsed = listMyBuildingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeListMyBuildingsUseCaseImpl(parsed.data, {
    buildingRepository,
  });
}
