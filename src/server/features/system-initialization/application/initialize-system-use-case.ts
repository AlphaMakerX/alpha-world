import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { executeAdamStep } from "./execute-adam-step";
import { executeBot1Step } from "./execute-bot1-step";
import { executePlotStep } from "./execute-plot-step";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import { ADAM_PERSONA_CONFIG, BOT1_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

const DEFAULT_STEP: InitializeSystemRequestedStep = "all";

export type InitializeSystemRequestedStep = "all" | "adam" | "bot1" | "plot";
export type InitializeSystemStep = Exclude<InitializeSystemRequestedStep, "all">;

export type InitializeSystemCommand = {
  step?: InitializeSystemRequestedStep;
};

type InitializeSystemSuccessResult = {
  ok: true;
  summary: {
    executedSteps: InitializeSystemStep[];
    adamUsername: string;
    botUsername: string;
    transferredAmount: number;
    transferSkipped: boolean;
    plotsSeededCount: number;
    plotRange: {
      from: string;
      to: string;
    } | null;
  };
};

type InitializeSystemFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type InitializeSystemResult = InitializeSystemSuccessResult | InitializeSystemFailureResult;

export type InitializeSystemUseCaseDeps = {
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  passwordHasher: PasswordHasher;
  systemAccountService: SystemAccountService;
  systemInitializationRepository: {
    hasMoneyTransfer(input: {
      fromUserId: string;
      toUserId: string;
      referenceId: string;
    }): Promise<boolean>;
    upsertPlotsPriceIfUnowned(input: {
      totalRows: number;
      colsPerRow: number;
      minPrice: number;
      maxPrice: number;
    }): Promise<void>;
  };
};

function isFailureResult(result: unknown): result is InitializeSystemFailureResult {
  return typeof result === "object" && result !== null && "ok" in result && result.ok === false;
}

export async function executeInitializeSystemUseCase(
  command: InitializeSystemCommand = {},
  deps: InitializeSystemUseCaseDeps,
): Promise<InitializeSystemResult> {
  const requestedStep = command.step ?? DEFAULT_STEP;
  const executedSteps: InitializeSystemStep[] = [];

  if (BOT1_PERSONA_CONFIG.transferAmount <= 0) {
    return {
      ok: false,
      error: "转账金额必须大于 0",
      code: "BAD_REQUEST",
    };
  }

  let transferSkipped = false;
  let plotsSeededCount = 0;
  let plotRange: { from: string; to: string } | null = null;

  switch (requestedStep) {
    case "all": {
      await executeAdamStep({
        deps,
      });
      executedSteps.push("adam");

      const bot1Result = await executeBot1Step({
        deps,
      });
      transferSkipped = bot1Result.transferSkipped;
      executedSteps.push("bot1");

      const plotResult = await executePlotStep({
        deps,
      });
      if (isFailureResult(plotResult)) {
        return plotResult;
      }
      plotsSeededCount = plotResult.plotsSeededCount;
      plotRange = plotResult.plotRange;
      executedSteps.push("plot");
      break;
    }
    case "adam": {
      await executeAdamStep({
        deps,
      });
      executedSteps.push("adam");
      break;
    }
    case "bot1": {
      const bot1Result = await executeBot1Step({
        deps,
      });
      transferSkipped = bot1Result.transferSkipped;
      executedSteps.push("bot1");
      break;
    }
    case "plot": {
      const plotResult = await executePlotStep({
        deps,
      });
      if (isFailureResult(plotResult)) {
        return plotResult;
      }
      plotsSeededCount = plotResult.plotsSeededCount;
      plotRange = plotResult.plotRange;
      executedSteps.push("plot");
      break;
    }
  }

  if (!executedSteps.includes("bot1")) {
    transferSkipped = true;
  }

  return {
    ok: true,
    summary: {
      executedSteps,
      adamUsername: ADAM_PERSONA_CONFIG.username,
      botUsername: BOT1_PERSONA_CONFIG.username,
      transferredAmount: executedSteps.includes("bot1") ? BOT1_PERSONA_CONFIG.transferAmount : 0,
      transferSkipped,
      plotsSeededCount,
      plotRange,
    },
  };
}
