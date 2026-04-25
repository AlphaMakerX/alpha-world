import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";

/** 内存版实现，用于单元测试 */
export class InMemoryUnlockedRecipeRepository implements UnlockedRecipeRepository {
  private store = new Map<number, Set<string>>();

  async save(buildingId: number, recipeId: string): Promise<void> {
    if (!this.store.has(buildingId)) {
      this.store.set(buildingId, new Set());
    }
    this.store.get(buildingId)!.add(recipeId);
  }

  async saveBatch(buildingId: number, recipeIds: string[]): Promise<void> {
    for (const recipeId of recipeIds) {
      await this.save(buildingId, recipeId);
    }
  }

  async isUnlocked(buildingId: number, recipeId: string): Promise<boolean> {
    return this.store.get(buildingId)?.has(recipeId) ?? false;
  }

  async findByBuildingId(buildingId: number): Promise<string[]> {
    return Array.from(this.store.get(buildingId) ?? []);
  }
}
