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

  switch (requestedStep) {
    case "all": {
      const adamResult = await executeAdamStep({
        deps,
      });
      if (isFailureResult(adamResult)) {
        return adamResult;
      }

      const bot1Result = await executeBot1Step({
        deps,
      });
      if (isFailureResult(bot1Result)) {
        return bot1Result;
      }

      const plotResult = await executePlotStep({
        deps,
      });
      if (isFailureResult(plotResult)) {
        return plotResult;
      }

      return {
        ok: true,
        summary: {
          executedSteps: ["adam", "bot1", "plot"],
          adamUsername: ADAM_PERSONA_CONFIG.username,
          botUsername: BOT1_PERSONA_CONFIG.username,
          transferredAmount: BOT1_PERSONA_CONFIG.transferAmount,
          transferSkipped: bot1Result.transferSkipped,
          plotsSeededCount: plotResult.plotsSeededCount,
          plotRange: plotResult.plotRange,
        },
      };
    }
    case "adam": {
      const adamResult = await executeAdamStep({
        deps,
      });
      if (isFailureResult(adamResult)) {
        return adamResult;
      }

      return {
        ok: true,
        summary: {
          executedSteps: ["adam"],
          adamUsername: ADAM_PERSONA_CONFIG.username,
          botUsername: BOT1_PERSONA_CONFIG.username,
          transferredAmount: 0,
          transferSkipped: true,
          plotsSeededCount: 0,
          plotRange: null,
        },
      };
    }
    case "bot1": {
      const bot1Result = await executeBot1Step({
        deps,
      });
      if (isFailureResult(bot1Result)) {
        return bot1Result;
      }

      return {
        ok: true,
        summary: {
          executedSteps: ["bot1"],
          adamUsername: ADAM_PERSONA_CONFIG.username,
          botUsername: BOT1_PERSONA_CONFIG.username,
          transferredAmount: BOT1_PERSONA_CONFIG.transferAmount,
          transferSkipped: bot1Result.transferSkipped,
          plotsSeededCount: 0,
          plotRange: null,
        },
      };
    }
    case "plot": {
      const plotResult = await executePlotStep({
        deps,
      });
      if (isFailureResult(plotResult)) {
        return plotResult;
      }

      return {
        ok: true,
        summary: {
          executedSteps: ["plot"],
          adamUsername: ADAM_PERSONA_CONFIG.username,
          botUsername: BOT1_PERSONA_CONFIG.username,
          transferredAmount: 0,
          transferSkipped: true,
          plotsSeededCount: plotResult.plotsSeededCount,
          plotRange: plotResult.plotRange,
        },
      };
    }
  }
}
