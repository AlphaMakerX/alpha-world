import { eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import { factoryUnlockedRecipes } from "@/server/features/factory/infrastructure/unlocked-recipe-schema";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";

/** 基于 Drizzle ORM 的已解锁配方仓储实现 */
export class DrizzleUnlockedRecipeRepository implements UnlockedRecipeRepository {
  async save(buildingId: number, recipeId: string): Promise<void> {
    await getDbClient()
      .insert(factoryUnlockedRecipes)
      .values({ buildingId, recipeId })
      .onConflictDoNothing();
  }

  async saveBatch(buildingId: number, recipeIds: string[]): Promise<void> {
    if (recipeIds.length === 0) return;
    await getDbClient()
      .insert(factoryUnlockedRecipes)
      .values(recipeIds.map((recipeId) => ({ buildingId, recipeId })))
      .onConflictDoNothing();
  }

  async isUnlocked(buildingId: number, recipeId: string): Promise<boolean> {
    const record = await getDbClient().query.factoryUnlockedRecipes.findFirst({
      where: (t, { and, eq }) => and(eq(t.buildingId, buildingId), eq(t.recipeId, recipeId)),
    });
    return !!record;
  }

  async findByBuildingId(buildingId: number): Promise<string[]> {
    const records = await getDbClient()
      .select({ recipeId: factoryUnlockedRecipes.recipeId })
      .from(factoryUnlockedRecipes)
      .where(eq(factoryUnlockedRecipes.buildingId, buildingId));
    return records.map((r) => r.recipeId);
  }
}

/** Drizzle 实现单例 */
export const unlockedRecipeRepository: UnlockedRecipeRepository = new DrizzleUnlockedRecipeRepository();
