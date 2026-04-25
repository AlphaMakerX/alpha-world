/** 工厂已解锁配方仓储接口 */
export interface UnlockedRecipeRepository {
  /** 保存单条解锁记录（幂等） */
  save(buildingId: number, recipeId: string): Promise<void>;
  /** 批量保存解锁记录（幂等） */
  saveBatch(buildingId: number, recipeIds: string[]): Promise<void>;
  /** 查询某配方是否已解锁 */
  isUnlocked(buildingId: number, recipeId: string): Promise<boolean>;
  /** 查询某工厂全部已解锁配方 ID */
  findByBuildingId(buildingId: number): Promise<string[]>;
}
