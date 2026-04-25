import type { FactorySubtype } from "@/server/features/building/domain/factory-subtype";

/** 非工厂类型建筑的建造费用 */
const baseBuildingCosts: Record<string, number> = {
  residential: 500,
  shop: 600,
  purchasing_station: 700,
};

/** 各工厂子类型的建造费用 */
const factoryCosts: Record<FactorySubtype, number> = {
  mine: 800,
  lumber_mill: 800,
  textile_mill: 900,
  ranch: 900,
  apothecary: 900,
  waterworks: 600,
  smelter: 1000,
  carpentry: 1000,
  paper_mill: 1000,
  assembler: 1200,
};

/** 根据建筑类型（和可选子类型）获取建造费用，未知类型返回 0 */
export function getBuildingCost(type: string, subtype?: string): number {
  if (type === "factory" && subtype) {
    return factoryCosts[subtype as FactorySubtype] ?? 0;
  }
  return baseBuildingCosts[type] ?? 0;
}
