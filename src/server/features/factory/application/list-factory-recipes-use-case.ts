import {
  listRecipes,
  listRecipesByFactorySubtypeAndLevel,
  type Recipe,
} from "@/server/features/recipe";
import type { FactoryRepository } from "@/server/features/factory/domain/repositories/factory-repository";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 查询参数 */
export type ListFactoryRecipesQuery = {
  buildingId?: number;
};

type RecipeWithUnlockStatus = Recipe & { unlocked: boolean };

/** 升级预览信息 */
type UpgradePreview = {
  nextLevel: number;
  cost: number;
  newRecipes: Array<{ id: string; name: string; category: string }>;
};

type ListFactoryRecipesSuccessResult = {
  ok: true;
  recipes: RecipeWithUnlockStatus[];
  upgradePreview: UpgradePreview | null;
};
type ListFactoryRecipesFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};
export type ListFactoryRecipesResult =
  | ListFactoryRecipesSuccessResult
  | ListFactoryRecipesFailureResult;

/** 用例所需的外部依赖 */
export type ListFactoryRecipesUseCaseDeps = {
  factoryRepository: FactoryRepository;
  unlockedRecipeRepository: UnlockedRecipeRepository;
};

/**
 * 查询工厂配方列表
 *
 * 有 buildingId 时按工厂类型和等级筛选并标注解锁状态，
 * 无 buildingId 时返回全量配方。
 */
export async function executeListFactoryRecipesUseCase(
  query: ListFactoryRecipesQuery,
  deps: ListFactoryRecipesUseCaseDeps,
): Promise<ListFactoryRecipesResult> {
  if (!query.buildingId) {
    const allRecipes = listRecipes();
    return {
      ok: true,
      recipes: allRecipes.map((r) => ({ ...r, unlocked: false })),
      upgradePreview: null,
    };
  }

  const factory = await deps.factoryRepository.findByBuildingId(query.buildingId);
  if (!factory) {
    return { ok: false, error: "该建筑不是工厂", code: "NOT_FOUND" };
  }

  const filtered = listRecipesByFactorySubtypeAndLevel(factory.subtype, factory.level);
  const unlockedIds = await deps.unlockedRecipeRepository.findByBuildingId(query.buildingId);
  const unlockedSet = new Set(unlockedIds);

  // 计算升级预览
  const upgradeCost = factory.getUpgradeCost();
  let upgradePreview: UpgradePreview | null = null;
  if (upgradeCost !== null) {
    const currentIds = new Set(filtered.map((r) => r.id));
    const nextLevelRecipes = listRecipesByFactorySubtypeAndLevel(factory.subtype, factory.level + 1);
    const newRecipes = nextLevelRecipes
      .filter((r) => !currentIds.has(r.id))
      .map((r) => ({ id: r.id, name: r.name, category: r.category }));
    upgradePreview = {
      nextLevel: factory.level + 1,
      cost: upgradeCost,
      newRecipes,
    };
  }

  return {
    ok: true,
    recipes: filtered.map((r) => ({ ...r, unlocked: unlockedSet.has(r.id) })),
    upgradePreview,
  };
}
