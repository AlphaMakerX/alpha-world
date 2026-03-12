import { plotRepository } from "@/server/features/plot/infrastructure";
import { buildingRepository } from "@/server/features/building/infrastructure";

export async function executeListPlotsUseCase() {
  const plots = await plotRepository.findAll();
  const buildingByPlotId = await buildingRepository.findByPlotIds(plots.map((plot) => plot.id));
  return {
    plots: plots.map((plot) => ({
      id: plot.id,
      x: plot.coordinate.getX(),
      y: plot.coordinate.getY(),
      ownerUserId: plot.ownerUserId,
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
