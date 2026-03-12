import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { Building } from "@/server/features/building/domain";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";

const buildBuildingSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  plotId: z.number().int().positive(),
  buildingType: z.enum(["residential", "factory", "shop"]),
});

type BuildBuildingSuccessResult = {
  ok: true;
  building: {
    id: number;
    plotId: number;
    type: "residential" | "factory" | "shop";
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

  try {
    const building = Building.construct({
      id: 0,
      plotId: parsed.data.plotId,
      type: parsed.data.buildingType,
    });
    const savedBuilding = await buildingRepository.save(building);

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
