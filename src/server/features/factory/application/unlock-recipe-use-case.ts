import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { getRecipeById } from "@/server/features/recipe";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 解锁配方的命令参数 */
export type UnlockRecipeCommand = {
  ownerUserId: string;
  buildingId: number;
  recipeId: string;
};

type UnlockRecipeSuccessResult = { ok: true };
type UnlockRecipeFailureResult = { ok: false; error: string; code: UseCaseErrorCode };
export type UnlockRecipeResult = UnlockRecipeSuccessResult | UnlockRecipeFailureResult;

/** 解锁配方用例所需的外部依赖 */
export type UnlockRecipeUseCaseDeps = {
  buildingRepository: BuildingRepository;
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  unlockedRecipeRepository: UnlockedRecipeRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/**
 * 执行解锁配方用例
 *
 * 流程：获取建筑 → ensureFactory → 获取配方 → 校验类型匹配 → 校验等级 →
 *       检查幂等 → 校验金币 → 事务扣款+写入解锁记录+记录流水
 */
export async function executeUnlockRecipeUseCase(
  command: UnlockRecipeCommand,
  deps: UnlockRecipeUseCaseDeps,
): Promise<UnlockRecipeResult> {
  // 获取建筑
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }

  // 校验是工厂
  let subtype: string;
  try {
    subtype = building.ensureFactory();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  // 校验地块归属
  const plot = await deps.plotRepository.findById(building.plotId);
  if (!plot) {
    return { ok: false, error: "地块不存在", code: "NOT_FOUND" };
  }
  if (plot.ownerUserId !== command.ownerUserId) {
    return { ok: false, error: "只能操作自己地块上的工厂", code: "CONFLICT" };
  }

  // 获取配方
  const recipe = getRecipeById(command.recipeId);
  if (!recipe) {
    return { ok: false, error: "配方不存在", code: "NOT_FOUND" };
  }

  // 校验工厂类型匹配
  if (recipe.factorySubtypes !== "*" && !recipe.factorySubtypes.includes(subtype as any)) {
    return { ok: false, error: "该工厂类型无法使用此配方", code: "CONFLICT" };
  }

  // 校验工厂等级
  if (building.level < recipe.requiredLevel) {
    return { ok: false, error: "工厂等级不足", code: "CONFLICT" };
  }

  // 幂等：已解锁则直接返回成功
  const alreadyUnlocked = await deps.unlockedRecipeRepository.isUnlocked(
    command.buildingId,
    command.recipeId,
  );
  if (alreadyUnlocked) {
    return { ok: true };
  }

  // 校验金币
  const owner = await deps.userRepository.findById(command.ownerUserId);
  if (!owner) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }
  if (owner.money < recipe.unlockCost) {
    return { ok: false, error: "金币不足", code: "CONFLICT" };
  }

  const adam = await deps.systemAccountService.getSystemAccount();

  // 事务：扣款 + 写入解锁记录 + 记录流水
  await deps.transact(async () => {
    owner.spendMoney(recipe.unlockCost);
    adam.receiveMoney(recipe.unlockCost);
    await deps.userRepository.save(owner);
    await deps.userRepository.save(adam);
    await deps.unlockedRecipeRepository.save(command.buildingId, command.recipeId);
    await deps.transactionLedgerRepository.record({
      fromUserId: command.ownerUserId,
      toUserId: adam.id,
      amount: recipe.unlockCost,
      type: "recipe_unlock",
      referenceId: `${command.buildingId}:${command.recipeId}`,
      description: `解锁配方: ${recipe.name}`,
    });
  });

  return { ok: true };
}
