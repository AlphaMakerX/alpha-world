/**
 * 开始工厂生产用例
 *
 * 处理用户在工厂建筑中启动生产的业务流程，包括：
 * 1. 校验建筑类型和地块归属
 * 2. 按配方和数量计算所需材料与产出
 * 3. 检查并扣除材料（物品和/或金钱）
 * 4. 创建生产任务并记录交易流水
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { FactoryProductionJob } from "@/server/features/factory/domain";
import { getRecipeById } from "@/server/features/recipe/application/recipe-catalog";
import type { FactoryProductionJobRepository } from "@/server/features/factory/domain";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 开始生产的命令参数 */
export type StartFactoryProductionCommand = {
  ownerUserId: string;
  buildingId: number;
  recipeId: string;
  quantity: number;
};

/** 启动生产成功的返回结果 */
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

/** 启动生产失败的返回结果 */
type StartFactoryProductionFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 用例返回类型（成功 | 失败） */
export type StartFactoryProductionResult =
  | StartFactoryProductionSuccessResult
  | StartFactoryProductionFailureResult;

/** 用例所需的外部依赖 */
export type StartFactoryProductionUseCaseDeps = {
  factoryProductionJobRepository: FactoryProductionJobRepository;
  buildingRepository: BuildingRepository;
  inventoryRepository: InventoryRepository;
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  unlockedRecipeRepository: UnlockedRecipeRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/**
 * 执行开始工厂生产用例
 *
 * 流程：校验建筑与配方 -> 检查无进行中任务 -> 按数量缩放材料与时长 ->
 *       校验材料充足 -> 事务内扣除材料、创建任务、记录流水
 */
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

  const recipe = getRecipeById(command.recipeId);
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

    // 校验配方是否已解锁
    const isUnlocked = await deps.unlockedRecipeRepository.isUnlocked(building.id, command.recipeId);
    if (!isUnlocked) {
      return {
        ok: false,
        error: "该工厂尚未解锁此配方",
        code: "CONFLICT",
      };
    }

    // 按制造数量等比缩放输入材料、输出产物和生产时长
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

    // 从输入材料中提取金钱成本（itemKey 为 "money" 的条目）
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

    // 逐项检查材料是否充足（金钱检查余额，物品检查库存）
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

    // 在事务中完成：扣除库存物品、扣款、创建生产任务、记录交易流水
    const savedJob = await deps.transact(async () => {
      // 扣除非金钱类的输入材料
      for (const inputItem of scaledInputs) {
        if (inputItem.itemKey === "money") {
          continue;
        }
        await deps.inventoryRepository.consumeItem(command.ownerUserId, inputItem.itemKey, inputItem.quantity);
      }

      // 金钱类成本：从用户扣款并转入系统账户
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
