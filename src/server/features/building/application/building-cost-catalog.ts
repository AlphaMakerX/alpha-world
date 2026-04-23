/**
 * 建筑建造费用目录
 *
 * 维护各类型建筑的建造成本配置，供建造用例查询费用。
 */

/** 各建筑类型对应的建造费用（单位：游戏货币） */
const buildingCosts: Record<string, number> = {
  residential: 500,
  factory: 800,
  shop: 600,
  purchasing_station: 700,
};

/** 根据建筑类型获取建造费用，未知类型返回 0 */
export function getBuildingCost(type: string): number {
  return buildingCosts[type] ?? 0;
}
