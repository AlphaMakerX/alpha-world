import { z } from "zod";
import { buildingRepository } from "@/server/features/building/infrastructure";

const listMyBuildingsSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
});

export async function executeListMyBuildingsUseCase(input: unknown) {
  const parsed = listMyBuildingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400 as const,
    };
  }

  const buildings = await buildingRepository.findByOwnerUserId(parsed.data.ownerUserId);
  return {
    ok: true as const,
    buildings: buildings.map((building) => ({
      id: building.id,
      plotId: building.plotId,
      type: building.type,
      status: building.status,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
    })),
  };
}
