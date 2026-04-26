import { getRecipeById } from "@/server/features/recipe";
import type { Recipe } from "@/server/features/recipe";
import type { Factory } from "@/server/features/factory/domain/entities/factory";
import type { FactoryRepository } from "@/server/features/factory/domain/repositories/factory-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import type { FinanceService } from "@/server/features/finance/domain/finance-service";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";
import type { User } from "@/server/features/person/domain/entities/user";

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
  factoryRepository: FactoryRepository;
  plotRepository: PlotRepository;
  userRepository: UserRepository;
  financeService: FinanceService;
  unlockedRecipeRepository: UnlockedRecipeRepository;
  systemAccountService: SystemAccountService;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** 校验通过后的上下文，包含业务逻辑所需的已验证数据 */
type ValidatedContext = {
  factory: Factory;
  recipe: Recipe;
  owner: User;
  adam: User;
};

/** 校验解锁配方的前置条件 */
async function validate(
  command: UnlockRecipeCommand,
  deps: UnlockRecipeUseCaseDeps,
): Promise<ValidatedContext | UnlockRecipeResult> {
  // 获取工厂
  const factory = await deps.factoryRepository.findByBuildingId(command.buildingId);
  if (!factory) {
    return { ok: false, error: "该建筑不是工厂", code: "NOT_FOUND" };
  }

  // 校验地块归属
  const plot = await deps.plotRepository.findById(factory.plotId);
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
  if (recipe.factorySubtypes !== "*" && !recipe.factorySubtypes.includes(factory.subtype as any)) {
    return { ok: false, error: "该工厂类型无法使用此配方", code: "CONFLICT" };
  }

  // 校验工厂等级
  if (factory.level < recipe.requiredLevel) {
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

  return { factory, recipe, owner, adam };
}

/** 判断校验结果是否为失败（或成功的早返回） */
function isFailure(result: ValidatedContext | UnlockRecipeResult): result is UnlockRecipeResult {
  return "ok" in result;
}

/**
 * 执行解锁配方用例
 *
 * 流程：获取工厂 → 校验地块归属 → 获取配方 → 校验类型匹配 → 校验等级 →
 *       检查幂等 → 校验金币 → 事务扣款+写入解锁记录+记录流水
 */
export async function executeUnlockRecipeUseCase(
  command: UnlockRecipeCommand,
  deps: UnlockRecipeUseCaseDeps,
): Promise<UnlockRecipeResult> {
  const validated = await validate(command, deps);
  if (isFailure(validated)) return validated;
  const { factory, recipe, owner, adam } = validated;

  // 事务：扣款 + 写入解锁记录 + 记录流水
  await deps.transact(async () => {
    await deps.unlockedRecipeRepository.save(command.buildingId, command.recipeId);
    await deps.financeService.transfer({
      payer: owner,
      receiver: adam,
      amount: recipe.unlockCost,
      type: "recipe_unlock",
      referenceId: `${command.buildingId}:${command.recipeId}`,
      description: `解锁配方: ${recipe.name}`,
    });
  });

  return { ok: true };
}
