import { executeBuildBuildingUseCase } from "@/server/features/building/application/build-building-use-case";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import { BOT1_MANAGER_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import { Username } from "@/server/features/person/domain/value-objects/username";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

type ExecuteBot1ManagerPurchasingStationBuildStepDeps = {
  userRepository: UserRepository;
  buildingRepository: BuildingRepository;
  plotRepository: PlotRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

type Bot1ManagerPurchasingStationBuildStepSuccessResult = {
  builtCount: number;
  builtPlotId: number | null;
};

type Bot1ManagerPurchasingStationBuildStepFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type ExecuteBot1ManagerPurchasingStationBuildStepResult =
  | Bot1ManagerPurchasingStationBuildStepSuccessResult
  | Bot1ManagerPurchasingStationBuildStepFailureResult;

export async function executeBot1ManagerPurchasingStationBuildStep(input: {
  deps: ExecuteBot1ManagerPurchasingStationBuildStepDeps;
}): Promise<ExecuteBot1ManagerPurchasingStationBuildStepResult> {
  const bot = await input.deps.userRepository.findByUsername(
    Username.create(BOT1_MANAGER_PERSONA_CONFIG.username),
  );
  if (!bot) {
    return {
      ok: false,
      error: "bot1-manager 尚未初始化，请先执行 bot1-manager 步骤",
      code: "BAD_REQUEST",
    };
  }

  const existingBuildings = await input.deps.buildingRepository.findByOwnerUserId(bot.id);
  if (existingBuildings.some((building) => building.type === "purchasing_station")) {
    return {
      builtCount: 0,
      builtPlotId: null,
    };
  }

  const plots = await input.deps.plotRepository.findAll();
  const botOwnedPlotIds = plots
    .filter((plot) => plot.ownerUserId === bot.id)
    .map((plot) => plot.id)
    .sort((a, b) => a - b);

  if (botOwnedPlotIds.length === 0) {
    return {
      ok: false,
      error: "bot1-manager 暂无地块，请先执行 bot1-manager-plot-purchase 步骤",
      code: "BAD_REQUEST",
    };
  }

  const buildingByPlotId = await input.deps.buildingRepository.findByPlotIds(botOwnedPlotIds);
  const candidatePlotId = botOwnedPlotIds.find((plotId) => !buildingByPlotId.has(plotId));

  if (!candidatePlotId) {
    return {
      ok: false,
      error: "bot1-manager 已拥有地块，但无可建造的空地",
      code: "CONFLICT",
    };
  }

  const buildResult = await executeBuildBuildingUseCase(
    {
      ownerUserId: bot.id,
      plotId: candidatePlotId,
      buildingType: "purchasing_station",
    },
    {
      buildingRepository: input.deps.buildingRepository,
      plotRepository: input.deps.plotRepository,
      userRepository: input.deps.userRepository,
      transactionLedgerRepository: input.deps.transactionLedgerRepository,
      systemAccountService: input.deps.systemAccountService,
      transact: input.deps.transact,
    },
  );
  if (!buildResult.ok) {
    return buildResult;
  }

  return {
    builtCount: 1,
    builtPlotId: buildResult.building.plotId,
  };
}
