import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";

export type ListPlotsUseCaseDeps = {
  plotRepository: PlotRepository;
  buildingRepository: BuildingRepository;
  userRepository: UserRepository;
};

export async function executeListPlotsUseCase(deps: ListPlotsUseCaseDeps) {
  const plots = await deps.plotRepository.findAll();
  const buildingByPlotId = await deps.buildingRepository.findByPlotIds(plots.map((plot) => plot.id));
  const ownerUserIds = Array.from(
    new Set(plots.map((plot) => plot.ownerUserId).filter((ownerUserId): ownerUserId is string => Boolean(ownerUserId))),
  );
  const ownerUsernameByUserId = new Map<string, string>();
  await Promise.all(
    ownerUserIds.map(async (ownerUserId) => {
      const owner = await deps.userRepository.findById(ownerUserId);
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
