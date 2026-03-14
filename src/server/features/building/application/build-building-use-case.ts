import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { ADAM_USER_ID } from "@/server/features/shared-kernel/domain/adam";
import { Building } from "@/server/features/building/domain";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { userRepository, transactionLedgerRepository } from "@/server/features/person/infrastructure";
import { getBuildingCost } from "@/server/features/building/application/building-cost-catalog";

const buildBuildingSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  plotId: z.number().int().positive(),
  buildingType: z.enum(["residential", "factory", "shop", "purchasing_station"]),
});

type BuildBuildingSuccessResult = {
  ok: true;
  building: {
    id: number;
    plotId: number;
    type: "residential" | "factory" | "shop" | "purchasing_station";
    status: "active";
    createdAt: Date;
    updatedAt: Date;
  };
};

type BuildBuildingFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type BuildBuildingResult = BuildBuildingSuccessResult | BuildBuildingFailureResult;
export type BuildBuildingInput = z.input<typeof buildBuildingSchema>;

export async function executeBuildBuildingUseCase(
  input: BuildBuildingInput,
): Promise<BuildBuildingResult> {
  const parsed = buildBuildingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const plot = await plotRepository.findById(parsed.data.plotId);
  if (!plot) {
    return {
      ok: false,
      error: "地块不存在",
      status: 404,
    };
  }
  if (plot.ownerUserId !== parsed.data.ownerUserId) {
    return {
      ok: false,
      error: "只能在自己的地块建造",
      status: 409,
    };
  }

  const existingBuilding = await buildingRepository.findByPlotId(parsed.data.plotId);
  if (existingBuilding) {
    return {
      ok: false,
      error: "该地块已有建筑",
      status: 409,
    };
  }

  const cost = getBuildingCost(parsed.data.buildingType);

  const owner = await userRepository.findById(parsed.data.ownerUserId);
  if (!owner) {
    return { ok: false, error: "用户不存在", status: 404 };
  }

  const adam = await userRepository.findById(ADAM_USER_ID);
  if (!adam) {
    return { ok: false, error: "系统尚未初始化", status: 400 };
  }

  try {
    if (cost > 0) {
      owner.spendMoney(cost);
      adam.receiveMoney(cost);
    }

    const building = Building.construct({
      id: 0,
      plotId: parsed.data.plotId,
      type: parsed.data.buildingType,
    });

    await userRepository.save(owner);
    await userRepository.save(adam);
    const savedBuilding = await buildingRepository.save(building);

    if (cost > 0) {
      await transactionLedgerRepository.record({
        fromUserId: parsed.data.ownerUserId,
        toUserId: ADAM_USER_ID,
        amount: cost,
        type: "building_construction",
        referenceId: String(savedBuilding.id),
        description: `建造${parsed.data.buildingType} @ 地块 ${parsed.data.plotId}`,
      });
    }

    return {
      ok: true,
      building: {
        id: savedBuilding.id,
        plotId: savedBuilding.plotId,
        type: savedBuilding.type,
        status: savedBuilding.status,
        createdAt: savedBuilding.createdAt,
        updatedAt: savedBuilding.updatedAt,
      },
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        ok: false,
        error: error.message,
        status: 409,
      };
    }
    throw error;
  }
}
