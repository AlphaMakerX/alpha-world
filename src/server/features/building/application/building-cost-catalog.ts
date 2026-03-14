const buildingCosts: Record<string, number> = {
  residential: 500,
  factory: 800,
  shop: 600,
};

export function getBuildingCost(type: string): number {
  return buildingCosts[type] ?? 0;
}
