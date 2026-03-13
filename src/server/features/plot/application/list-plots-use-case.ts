import { plotRepository } from "@/server/features/plot/infrastructure";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { userRepository } from "@/server/features/person/infrastructure";

export async function executeListPlotsUseCase() {
  const plots = await plotRepository.findAll();
  const buildingByPlotId = await buildingRepository.findByPlotIds(plots.map((plot) => plot.id));
  const ownerUserIds = Array.from(
    new Set(plots.map((plot) => plot.ownerUserId).filter((ownerUserId): ownerUserId is string => Boolean(ownerUserId))),
  );
  const ownerUsernameByUserId = new Map<string, string>();
  await Promise.all(
    ownerUserIds.map(async (ownerUserId) => {
      const owner = await userRepository.findById(ownerUserId);
      if (owner) {
        ownerUsernameByUserId.set(ownerUserId, owner.username.getValue());
      }
    }),
  );

  return {
    plots: plots.map((plot) => ({
      id: plot.id,
      x: plot.coordinate.getX(),
      y: plot.coordinate.getY(),
      ownerUserId: plot.ownerUserId,
      ownerUsername: plot.ownerUserId ? ownerUsernameByUserId.get(plot.ownerUserId) ?? null : null,
      status: plot.status,
      price: plot.price,
      createdAt: plot.createdAt,
      updatedAt: plot.updatedAt,
      building: (() => {
        const building = buildingByPlotId.get(plot.id);
        if (!building) {
          return null;
        }
        return {
          id: building.id,
          plotId: building.plotId,
          type: building.type,
          status: building.status,
          createdAt: building.createdAt,
          updatedAt: building.updatedAt,
        };
      })(),
    })),
  };
}
