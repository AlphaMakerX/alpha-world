import { executePurchasePlotUseCase } from "@/server/features/plot/application/purchase-plot-use-case";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { BOT1_MANAGER_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import { Username } from "@/server/features/person/domain/value-objects/username";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

const BOT1_MANAGER_TARGET_PLOT_COUNT = 8;

type ExecuteBot1ManagerPlotPurchaseStepDeps = {
  userRepository: UserRepository;
  plotRepository: PlotRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

type Bot1ManagerPlotPurchaseStepSuccessResult = {
  purchasedPlotsCount: number;
  purchasedPlotIds: number[];
};

type Bot1ManagerPlotPurchaseStepFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type ExecuteBot1ManagerPlotPurchaseStepResult =
  | Bot1ManagerPlotPurchaseStepSuccessResult
  | Bot1ManagerPlotPurchaseStepFailureResult;

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function executeBot1ManagerPlotPurchaseStep(input: {
  deps: ExecuteBot1ManagerPlotPurchaseStepDeps;
}): Promise<ExecuteBot1ManagerPlotPurchaseStepResult> {
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

  const plots = await input.deps.plotRepository.findAll();
  const ownedCount = plots.filter((plot) => plot.ownerUserId === bot.id).length;
  const requiredCount = Math.max(0, BOT1_MANAGER_TARGET_PLOT_COUNT - ownedCount);

  if (requiredCount === 0) {
    return {
      purchasedPlotsCount: 0,
      purchasedPlotIds: [],
    };
  }

  const availablePlots = plots.filter((plot) => plot.status === "available" && plot.ownerUserId === null);
  const selectedPlots = shuffle(availablePlots).slice(0, requiredCount);

  const purchasedPlotIds: number[] = [];

  for (const plot of selectedPlots) {
    const purchaseResult = await executePurchasePlotUseCase(
      {
        plotId: plot.id,
        buyerUserId: bot.id,
      },
      {
        plotRepository: input.deps.plotRepository,
        userRepository: input.deps.userRepository,
        transactionLedgerRepository: input.deps.transactionLedgerRepository,
        systemAccountService: input.deps.systemAccountService,
        transact: input.deps.transact,
      },
    );

    if (!purchaseResult.ok) {
      if (purchaseResult.code === "CONFLICT") {
        continue;
      }
      return purchaseResult;
    }

    purchasedPlotIds.push(purchaseResult.plot.id);
  }

  return {
    purchasedPlotsCount: purchasedPlotIds.length,
    purchasedPlotIds,
  };
}
