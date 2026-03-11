export const GAME_CONFIG = {
  world: {
    worldId: "alpha-main-1",
    mapSize: 20,
  },
  player: {
    initialCoins: 2000,
    staminaMax: 100,
    staminaCostRollDice: 10,
    staminaRecoverAmount: 5,
    staminaRecoverIntervalSec: 300,
  },
  tile: {
    basePrice: 200,
    baseRent: 40,
  },
  building: {
    maxLevel: 3,
    buildCost: {
      residential: 300,
      factory: 500,
      shop: 450,
    },
    upgradeCostFactor: 0.8,
    maintenanceFeePerLevel: 1,
    maintenanceIntervalSec: 60000,
  },
  production: {
    durationSec: 120,
    outputPerBatch: 5,
  },
  market: {
    systemPrices: {
      wood: 30,
      brick: 45,
    },
    tradeFeeRate: 0.05,
  },
  economy: {
    landTaxRate: 0.001,
    landTaxIntervalSec: 180000,
    lapRewardCoins: 100,
  },
};

export const TILE_NAMES = [
  "晨港码头",
  "微光街口",
  "赤砂广场",
  "蒸汽工段",
  "白榆里",
  "铁轨转盘",
  "映日市场",
  "钟楼拐角",
  "铜雀仓库",
  "雨棚街",
  "云井坡",
  "旧港长堤",
  "琥珀巷",
  "炉心街",
  "南岸桥头",
  "琉璃花园",
  "长明货栈",
  "塔影大道",
  "北风回环",
  "起点圆庭",
];

