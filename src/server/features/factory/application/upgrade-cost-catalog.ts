/** 工厂升级费用表：key 为当前等级，value 为升级到下一级的费用 */
const upgradeCosts: Record<number, number> = {
  1: 1000,
  2: 3000,
};

/** 根据当前等级获取升级费用，无对应等级返回 null（已达上限） */
export function getUpgradeCost(currentLevel: number): number | null {
  return upgradeCosts[currentLevel] ?? null;
}
