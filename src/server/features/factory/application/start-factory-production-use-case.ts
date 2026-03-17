import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { FactoryProductionJob } from "@/server/features/factory/domain";
import { getFactoryRecipeById } from "@/server/features/factory/application/factory-recipe-catalog";
import type { FactoryProductionJobRepository } from "@/server/features/factory/domain";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

export type StartFactoryProductionCommand = {
  ownerUserId: string;
  buildingId: number;
  recipeId: string;
  quantity: number;
};

type StartFactoryProductionSuccessResult = {
  ok: true;
  job: {
    id: number;
    buildingId: number;
    ownerUserId: string;
    recipeId: string;
    status: "in_progress" | "collected" | "cancelled";
    startedAt: Date;
    finishAt: Date;
  };
};

type StartFactoryProductionFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type StartFactoryProductionResult =
  | StartFactoryProductionSuccessResult
  | StartFactoryProductionFailureResult;

export type StartFactoryProductionUseCaseDeps = {
  factoryProductionJobRepository: FactoryProductionJobRepository;
  buildingRepository: BuildingRepository;
  inventoryRepository: InventoryRepository;
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executeStartFactoryProductionUseCase(
  command: StartFactoryProductionCommand,
  deps: StartFactoryProductionUseCaseDeps,
): Promise<StartFactoryProductionResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return {
      ok: false,
      error: "建筑不存在",
      code: "NOT_FOUND",
    };
  }

  const recipe = getFactoryRecipeById(command.recipeId);
  if (!recipe) {
    return {
      ok: false,
      error: "配方不存在",
      code: "NOT_FOUND",
    };
  }

  const inProgressJob = await deps.factoryProductionJobRepository.findInProgressByBuildingId(building.id);
  if (inProgressJob) {
    return {
      ok: false,
      error: "工厂已有进行中的生产任务",
      code: "CONFLICT",
    };
  }

  try {
    const plot = await deps.plotRepository.findById(building.plotId);
    if (!plot) {
      return {
        ok: false,
        error: "地块不存在",
        code: "NOT_FOUND",
      };
    }
    if (plot.ownerUserId !== command.ownerUserId) {
      return {
        ok: false,
        error: "只能操作自己地块上的工厂",
        code: "CONFLICT",
      };
    }
    building.ensureFactory();

    const qty = command.quantity;
    const scaledInputs = recipe.inputs.map((item) => ({
      itemKey: item.itemKey,
      quantity: item.quantity * qty,
    }));
    const scaledOutputs = recipe.outputs.map((item) => ({
      itemKey: item.itemKey,
      quantity: item.quantity * qty,
    }));
    const scaledDuration = recipe.durationSeconds * qty;

    const moneyCost = scaledInputs
      .filter((inputItem) => inputItem.itemKey === "money")
      .reduce((sum, inputItem) => sum + inputItem.quantity, 0);
    const ownerUser = moneyCost > 0 ? await deps.userRepository.findById(command.ownerUserId) : null;
    if (moneyCost > 0 && !ownerUser) {
      return {
        ok: false,
        error: "用户不存在",
        code: "NOT_FOUND",
      };
    }

    const adam = moneyCost > 0 ? await deps.systemAccountService.getSystemAccount() : null;

    for (const inputItem of scaledInputs) {
      if (inputItem.itemKey === "money") {
        if ((ownerUser?.money ?? 0) < inputItem.quantity) {
          return {
            ok: false,
            error: "余额不足，无法开始生产",
            code: "CONFLICT",
          };
        }
        continue;
      }
      const quantity = await deps.inventoryRepository.getItemQuantity(command.ownerUserId, inputItem.itemKey);
      if (quantity < inputItem.quantity) {
        return {
          ok: false,
          error: `材料不足: ${inputItem.itemKey}`,
          code: "CONFLICT",
        };
      }
    }

    const savedJob = await deps.transact(async () => {
      for (const inputItem of scaledInputs) {
        if (inputItem.itemKey === "money") {
          continue;
        }
        await deps.inventoryRepository.consumeItem(command.ownerUserId, inputItem.itemKey, inputItem.quantity);
      }

      if (ownerUser && adam && moneyCost > 0) {
        ownerUser.spendMoney(moneyCost);
        adam.receiveMoney(moneyCost);
        await deps.userRepository.save(ownerUser);
        await deps.userRepository.save(adam);
      }

      const job = FactoryProductionJob.start({
        id: 0,
        buildingId: building.id,
        ownerUserId: command.ownerUserId,
        recipeId: recipe.id,
        inputs: scaledInputs,
        outputs: scaledOutputs,
        durationSeconds: scaledDuration,
      });
      const savedJob = await deps.factoryProductionJobRepository.save(job);

      if (moneyCost > 0) {
        await deps.transactionLedgerRepository.record({
          fromUserId: command.ownerUserId,
          toUserId: adam!.id,
          amount: moneyCost,
          type: "factory_production",
          referenceId: String(savedJob.id),
          description: `工厂生产: ${recipe.name} ×${qty}`,
        });
      }
      return savedJob;
    });

    return {
      ok: true,
      job: {
        id: savedJob.id,
        buildingId: savedJob.buildingId,
        ownerUserId: savedJob.ownerUserId,
        recipeId: savedJob.recipeId,
        status: savedJob.status,
        startedAt: savedJob.startedAt,
        finishAt: savedJob.finishAt,
      },
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        ok: false,
        error: error.message,
        code: "CONFLICT",
      };
    }
    throw error;
  }
}
