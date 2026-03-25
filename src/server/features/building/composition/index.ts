import { z } from "zod";
import {
  executeBuildBuildingUseCase as executeBuildBuildingUseCaseImpl,
  type BuildBuildingResult,
} from "@/server/features/building/application/build-building-use-case";
import {
  executeListMyBuildingsUseCase as executeListMyBuildingsUseCaseImpl,
  type ListMyBuildingsResult,
} from "@/server/features/building/application/list-my-buildings-use-case";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { transactionLedgerRepository, userRepository, systemAccountService } from "@/server/features/person/infrastructure";
import { transact } from "@/server/lib/db";

export const buildBuildingSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  plotId: z.number().int().positive(),
  buildingType: z.enum(["residential", "factory", "shop", "purchasing_station"]),
});

export const listMyBuildingsSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
});

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
    transactionLedgerRepository,
    systemAccountService,
    transact,
  });
}

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
