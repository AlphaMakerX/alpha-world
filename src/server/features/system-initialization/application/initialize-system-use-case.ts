/**
 * 系统初始化用例
 *
 * 编排所有系统初始化步骤，支持按步骤单独执行或全部执行。
 * 步骤执行顺序：adam -> bot1-manager -> plot -> bot1-manager-plot-purchase
 * -> bot1-manager-purchasing-station-build -> bot1-manager-buy-orders
 */

import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { executeAdamStep } from "./execute-adam-step";
import { executeBot1ManagerStep } from "./execute-bot1-manager-step";
import { executeBot1ManagerPlotPurchaseStep } from "./execute-bot1-manager-plot-purchase-step";
import { executeBot1ManagerPurchasingStationBuildStep } from "./execute-bot1-manager-purchasing-station-build-step";
import { executeBot1ManagerBuyOrdersStep } from "./execute-bot1-manager-buy-orders-step";
import { executePlotStep } from "./execute-plot-step";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import {
  ADAM_PERSONA_CONFIG,
  BOT1_MANAGER_PERSONA_CONFIG,
} from "@/server/features/person/domain/personas";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 默认执行所有步骤 */
const DEFAULT_STEP: InitializeSystemRequestedStep = "all";

/** 支持请求的步骤枚举（含 "all" 表示全部执行） */
export type InitializeSystemRequestedStep =
  | "all"
  | "adam"
  | "bot1-manager"
  | "plot"
  | "bot1-manager-plot-purchase"
  | "bot1-manager-purchasing-station-build"
  | "bot1-manager-buy-orders";
/** 实际可执行的单个步骤（排除 "all"） */
export type InitializeSystemStep = Exclude<InitializeSystemRequestedStep, "all">;

/** 系统初始化命令 */
export type InitializeSystemCommand = {
  step?: InitializeSystemRequestedStep;
};

/** 初始化成功结果，包含执行摘要 */
type InitializeSystemSuccessResult = {
  ok: true;
  summary: {
    executedSteps: InitializeSystemStep[];
    adamUsername: string;
    botUsername: string;
    transferredAmount: number;
    transferSkipped: boolean;
    plotsSeededCount: number;
    botPurchasedPlotsCount: number;
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

/** 用例所需的全部外部依赖 */
export type InitializeSystemUseCaseDeps = {
  userRepository: UserRepository;
  buildingRepository: BuildingRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  passwordHasher: PasswordHasher;
  systemAccountService: SystemAccountService;
  plotRepository: PlotRepository;
  buyOrderRepository: BuyOrderRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
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

/** 类型守卫：判断步骤结果是否为失败 */
function isFailureResult(result: unknown): result is InitializeSystemFailureResult {
  return typeof result === "object" && result !== null && "ok" in result && result.ok === false;
}

/**
 * 执行系统初始化用例
 *
 * 根据 command.step 决定执行单个步骤还是全部步骤。
 * 每个步骤失败时立即中断并返回错误。
 */
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

      const bot1ManagerResult = await executeBot1ManagerStep({
        deps,
      });
      if (isFailureResult(bot1ManagerResult)) {
        return bot1ManagerResult;
      }

      const plotResult = await executePlotStep({
        deps,
      });
      if (isFailureResult(plotResult)) {
        return plotResult;
      }

      const bot1ManagerPlotPurchaseResult = await executeBot1ManagerPlotPurchaseStep({
        deps,
      });
      if (isFailureResult(bot1ManagerPlotPurchaseResult)) {
        return bot1ManagerPlotPurchaseResult;
      }

      const bot1ManagerPurchasingStationBuildResult =
        await executeBot1ManagerPurchasingStationBuildStep({
          deps,
        });
      if (isFailureResult(bot1ManagerPurchasingStationBuildResult)) {
        return bot1ManagerPurchasingStationBuildResult;
      }

      const bot1ManagerBuyOrdersResult = await executeBot1ManagerBuyOrdersStep({
        deps,
      });
      if (isFailureResult(bot1ManagerBuyOrdersResult)) {
        return bot1ManagerBuyOrdersResult;
      }

      return {
        ok: true,
        summary: {
          executedSteps: [
            "adam",
            "bot1-manager",
            "plot",
            "bot1-manager-plot-purchase",
            "bot1-manager-purchasing-station-build",
            "bot1-manager-buy-orders",
          ],
          adamUsername: ADAM_PERSONA_CONFIG.username,
          botUsername: BOT1_MANAGER_PERSONA_CONFIG.username,
          transferredAmount: BOT1_MANAGER_PERSONA_CONFIG.transferAmount,
          transferSkipped: bot1ManagerResult.transferSkipped,
          plotsSeededCount: plotResult.plotsSeededCount,
          botPurchasedPlotsCount: bot1ManagerPlotPurchaseResult.purchasedPlotsCount,
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
          botUsername: BOT1_MANAGER_PERSONA_CONFIG.username,
          transferredAmount: 0,
          transferSkipped: true,
          plotsSeededCount: 0,
          botPurchasedPlotsCount: 0,
          plotRange: null,
        },
      };
    }
    case "bot1-manager": {
      const bot1ManagerResult = await executeBot1ManagerStep({
        deps,
      });
      if (isFailureResult(bot1ManagerResult)) {
        return bot1ManagerResult;
      }

      return {
        ok: true,
        summary: {
          executedSteps: ["bot1-manager"],
          adamUsername: ADAM_PERSONA_CONFIG.username,
          botUsername: BOT1_MANAGER_PERSONA_CONFIG.username,
          transferredAmount: BOT1_MANAGER_PERSONA_CONFIG.transferAmount,
          transferSkipped: bot1ManagerResult.transferSkipped,
          plotsSeededCount: 0,
          botPurchasedPlotsCount: 0,
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
          botUsername: BOT1_MANAGER_PERSONA_CONFIG.username,
          transferredAmount: 0,
          transferSkipped: true,
          plotsSeededCount: plotResult.plotsSeededCount,
          botPurchasedPlotsCount: 0,
          plotRange: plotResult.plotRange,
        },
      };
    }
    case "bot1-manager-plot-purchase": {
      const bot1ManagerPlotPurchaseResult = await executeBot1ManagerPlotPurchaseStep({
        deps,
      });
      if (isFailureResult(bot1ManagerPlotPurchaseResult)) {
        return bot1ManagerPlotPurchaseResult;
      }

      return {
        ok: true,
        summary: {
          executedSteps: ["bot1-manager-plot-purchase"],
          adamUsername: ADAM_PERSONA_CONFIG.username,
          botUsername: BOT1_MANAGER_PERSONA_CONFIG.username,
          transferredAmount: 0,
          transferSkipped: true,
          plotsSeededCount: 0,
          botPurchasedPlotsCount: bot1ManagerPlotPurchaseResult.purchasedPlotsCount,
          plotRange: null,
        },
      };
    }
    case "bot1-manager-purchasing-station-build": {
      const bot1ManagerPurchasingStationBuildResult =
        await executeBot1ManagerPurchasingStationBuildStep({
          deps,
        });
      if (isFailureResult(bot1ManagerPurchasingStationBuildResult)) {
        return bot1ManagerPurchasingStationBuildResult;
      }

      return {
        ok: true,
        summary: {
          executedSteps: ["bot1-manager-purchasing-station-build"],
          adamUsername: ADAM_PERSONA_CONFIG.username,
          botUsername: BOT1_MANAGER_PERSONA_CONFIG.username,
          transferredAmount: 0,
          transferSkipped: true,
          plotsSeededCount: 0,
          botPurchasedPlotsCount: 0,
          plotRange: null,
        },
      };
    }
    case "bot1-manager-buy-orders": {
      const bot1ManagerBuyOrdersResult = await executeBot1ManagerBuyOrdersStep({
        deps,
      });
      if (isFailureResult(bot1ManagerBuyOrdersResult)) {
        return bot1ManagerBuyOrdersResult;
      }

      return {
        ok: true,
        summary: {
          executedSteps: ["bot1-manager-buy-orders"],
          adamUsername: ADAM_PERSONA_CONFIG.username,
          botUsername: BOT1_MANAGER_PERSONA_CONFIG.username,
          transferredAmount: 0,
          transferSkipped: true,
          plotsSeededCount: 0,
          botPurchasedPlotsCount: 0,
          plotRange: null,
        },
      };
    }
  }
}
