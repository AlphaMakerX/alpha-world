/**
 * 设定住宅休息价格用例
 *
 * 住宅主人设定对外休息服务价格，null 表示关闭对外服务。
 */
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 设定价格的命令参数 */
export type SetRestPriceCommand = {
  userId: string;
  buildingId: number;
  price: number | null;
};

type SetRestPriceResult =
  | { ok: true }
  | { ok: false; error: string; code: UseCaseErrorCode };

/** 用例所需的外部依赖 */
export type SetRestPriceUseCaseDeps = {
  buildingRepository: BuildingRepository;
  plotRepository: PlotRepository;
};

/** 执行设定休息价格用例 */
export async function executeSetRestPriceUseCase(
  command: SetRestPriceCommand,
  deps: SetRestPriceUseCaseDeps,
): Promise<SetRestPriceResult> {
  if (command.price !== null && command.price < 0) {
    return { ok: false, error: "休息价格不能为负数", code: "BAD_REQUEST" };
  }

  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }

  if (building.type !== "residential") {
    return { ok: false, error: "当前建筑不是住宅", code: "CONFLICT" };
  }

  const plot = await deps.plotRepository.findById(building.plotId);
  if (!plot || plot.ownerUserId !== command.userId) {
    return { ok: false, error: "只能设定自己住宅的价格", code: "CONFLICT" };
  }

  building.setRestPrice(command.price);
  await deps.buildingRepository.save(building);

  return { ok: true };
}
