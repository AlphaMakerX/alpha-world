/**
 * 发起住宅休息用例
 *
 * 玩家在住宅（自己的或别人的）发起休息，花费金币，等待后恢复体力。
 */
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { FinanceService } from "@/server/features/finance/application/services/finance-service";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { RestJobRepository } from "@/server/features/residential/domain/repositories/rest-job-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import { RestJob } from "@/server/features/residential/domain/entities/rest-job";
import { FULL_REST } from "@/server/features/residential/domain/rest-catalog";

/** 发起休息的命令参数 */
export type StartRestCommand = {
  userId: string;
  buildingId: number;
};

type StartRestResult =
  | { ok: true; job: { id: number; buildingId: number; status: string; startedAt: Date; finishAt: Date } }
  | { ok: false; error: string; code: UseCaseErrorCode };

/** 用例所需的外部依赖 */
export type StartRestUseCaseDeps = {
  buildingRepository: BuildingRepository;
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  restJobRepository: RestJobRepository;
  financeService: FinanceService;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 执行发起休息用例 */
export async function executeStartRestUseCase(
  command: StartRestCommand,
  deps: StartRestUseCaseDeps,
): Promise<StartRestResult> {
  // 校验建筑
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }
  if (building.type !== "residential") {
    return { ok: false, error: "当前建筑不是住宅", code: "CONFLICT" };
  }

  // 校验地块归属
  const plot = await deps.plotRepository.findById(building.plotId);
  if (!plot) {
    return { ok: false, error: "地块不存在", code: "NOT_FOUND" };
  }

  // 校验无进行中的休息任务
  const inProgressJob = await deps.restJobRepository.findInProgressByBuildingId(building.id);
  if (inProgressJob) {
    return { ok: false, error: "该住宅已有进行中的休息任务", code: "CONFLICT" };
  }

  if (!plot.ownerUserId) {
    return { ok: false, error: "该地块没有所有者", code: "CONFLICT" };
  }
  const plotOwnerId: string = plot.ownerUserId;
  const isOwnResidential = plotOwnerId === command.userId;

  // 确定费用
  let cost: number;
  if (isOwnResidential) {
    cost = FULL_REST.defaultCost;
  } else {
    if (building.restPrice === null) {
      return { ok: false, error: "该住宅未开放对外休息服务", code: "CONFLICT" };
    }
    cost = building.restPrice;
  }

  // 获取主人用户（自己或别人住宅都需要）
  const ownerUser = await deps.userRepository.findById(plotOwnerId);
  if (!ownerUser) {
    return { ok: false, error: "住宅主人不存在", code: "NOT_FOUND" };
  }

  // 获取付款用户
  const resterUser = await deps.userRepository.findById(command.userId);
  if (!resterUser) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  // 校验金币充足
  if (resterUser.money < cost) {
    return { ok: false, error: "金币不足", code: "CONFLICT" };
  }

  // 获取系统账户
  const adam = await deps.systemAccountService.getSystemAccount();

  // 事务执行
  const savedJob = await deps.transact(async () => {
    const job = RestJob.start({
      buildingId: building.id,
      ownerUserId: plotOwnerId,
      resterUserId: command.userId,
      restType: FULL_REST.id,
      staminaGain: FULL_REST.staminaGain,
      cost,
      durationSeconds: FULL_REST.durationSeconds,
    });
    const savedJob = await deps.restJobRepository.save(job);

    // 统一收费：90% 给主人，10% 给系统
    if (cost > 0) {
      const systemCut = Math.floor(cost * 0.1);
      const ownerCut = cost - systemCut;

      if (ownerCut > 0) {
        await deps.financeService.transfer({
          payer: resterUser,
          receiver: ownerUser,
          amount: ownerCut,
          type: "residential_rest",
          referenceId: String(savedJob.id),
          description: "住宅休息（主人收入）",
        });
      }
      if (systemCut > 0) {
        await deps.financeService.transfer({
          payer: resterUser,
          receiver: adam,
          amount: systemCut,
          type: "residential_rest",
          referenceId: String(savedJob.id),
          description: "住宅休息（系统抽成）",
        });
      }
    }

    return savedJob;
  });

  return {
    ok: true,
    job: {
      id: savedJob.id,
      buildingId: savedJob.buildingId,
      status: savedJob.status,
      startedAt: savedJob.startedAt,
      finishAt: savedJob.finishAt,
    },
  };
}
