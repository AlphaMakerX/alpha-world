import { plotRepository } from "@/server/features/plot/infrastructure";

export async function executeListPlotsUseCase() {
  const plots = await plotRepository.findAll();
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
    })),
  };
}
