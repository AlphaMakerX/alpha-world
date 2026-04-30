/**
 * 查询地块列表用例
 *
 * 查询所有地块及其关联的建筑和拥有者信息，聚合为完整的地块展示数据。
 */
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";

/** 用例依赖 */
export type ListPlotsUseCaseDeps = {
  plotRepository: PlotRepository;
  buildingRepository: BuildingRepository;
  userRepository: UserRepository;
};

/** 执行地块列表查询，聚合地块、建筑和拥有者数据 */
export async function executeListPlotsUseCase(deps: ListPlotsUseCaseDeps) {
  const plots = await deps.plotRepository.findAll();
  // 批量查询所有地块关联的建筑
  const buildingByPlotId = await deps.buildingRepository.findByPlotIds(plots.map((plot) => plot.id));
  // 收集所有拥有者 ID 并查询用户名
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
          subtype: building.subtype,
          level: building.level,
          status: building.status,
          restPrice: building.restPrice,
          createdAt: building.createdAt,
          updatedAt: building.updatedAt,
        };
      })(),
    })),
  };
}
