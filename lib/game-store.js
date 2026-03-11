import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { hashPassword, verifyPassword } from "@/lib/auth";
import { GAME_CONFIG, TILE_NAMES } from "@/lib/config";

const DATA_DIR = path.join(process.cwd(), "data");
const FILES = {
  world: path.join(DATA_DIR, "world.json"),
  players: path.join(DATA_DIR, "players.json"),
  tiles: path.join(DATA_DIR, "tiles.json"),
  transactions: path.join(DATA_DIR, "transactions.json"),
};

let cache = null;
let initPromise = null;
let mutationQueue = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getBuildCost(type) {
  return GAME_CONFIG.building.buildCost[type];
}

function getUpgradeCost(building) {
  return Math.round(getBuildCost(building.type) * building.level * GAME_CONFIG.building.upgradeCostFactor);
}

function createPlayerRecord(nickname, passwordHashValue) {
  const timestamp = nowIso();

  return {
    id: randomUUID(),
    nickname,
    passwordHash: passwordHashValue,
    coins: GAME_CONFIG.player.initialCoins,
    stamina: GAME_CONFIG.player.staminaMax,
    staminaUpdatedAt: timestamp,
    position: 0,
    inventory: {
      wood: 0,
      brick: 0,
    },
    tileIds: [],
    rentIncome: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createDefaultTiles() {
  return TILE_NAMES.map((name, index) => ({
    id: `tile-${index + 1}`,
    index,
    name,
    ownerId: null,
    price: GAME_CONFIG.tile.basePrice + (index % 4) * 20,
    building: null,
  }));
}

async function atomicWrite(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tempPath, filePath);
}

async function exists(filePath) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function seedDefaultFiles() {
  await mkdir(DATA_DIR, { recursive: true });

  const timestamp = nowIso();
  const defaults = {
    world: {
      worldId: GAME_CONFIG.world.worldId,
      mapSize: GAME_CONFIG.world.mapSize,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMaintenanceAt: timestamp,
      lastLandTaxAt: timestamp,
      config: GAME_CONFIG,
    },
    players: [
      createPlayerRecord("bot-alpha", hashPassword("bot12345")),
      createPlayerRecord("bot-bravo", hashPassword("bot12345")),
      createPlayerRecord("bot-charlie", hashPassword("bot12345")),
    ],
    tiles: createDefaultTiles(),
    transactions: [
      {
        id: randomUUID(),
        playerId: null,
        type: "system",
        amount: 0,
        itemName: null,
        tileId: null,
        message: "世界已初始化。可以注册新账号或使用预置账号登录。",
        timestamp,
      },
    ],
  };

  for (const [key, filePath] of Object.entries(FILES)) {
    if (!(await exists(filePath))) {
      await atomicWrite(filePath, defaults[key]);
    }
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadState() {
  if (cache) {
    return cache;
  }

  if (!initPromise) {
    initPromise = (async () => {
      await seedDefaultFiles();
      cache = {
        world: await readJson(FILES.world),
        players: await readJson(FILES.players),
        tiles: await readJson(FILES.tiles),
        transactions: await readJson(FILES.transactions),
      };

      return cache;
    })().finally(() => {
      initPromise = null;
    });
  }

  return initPromise;
}

async function persistState(state) {
  await Promise.all([
    atomicWrite(FILES.world, state.world),
    atomicWrite(FILES.players, state.players),
    atomicWrite(FILES.tiles, state.tiles),
    atomicWrite(FILES.transactions, state.transactions),
  ]);
}

function appendLog(state, message, details = {}) {
  state.transactions.unshift({
    id: randomUUID(),
    playerId: details.playerId ?? null,
    type: details.type ?? "system",
    amount: details.amount ?? 0,
    itemName: details.itemName ?? null,
    tileId: details.tileId ?? null,
    message,
    timestamp: nowIso(),
  });
  state.transactions = state.transactions.slice(0, 200);
}

function findPlayer(state, playerId) {
  return state.players.find((player) => player.id === playerId) ?? null;
}

function findTile(state, tileId) {
  return state.tiles.find((tile) => tile.id === tileId) ?? null;
}

function syncTileIds(state) {
  const ownedByPlayer = new Map();

  for (const player of state.players) {
    ownedByPlayer.set(player.id, []);
  }

  for (const tile of state.tiles) {
    if (tile.ownerId && ownedByPlayer.has(tile.ownerId)) {
      ownedByPlayer.get(tile.ownerId).push(tile.id);
    }
  }

  for (const player of state.players) {
    player.tileIds = ownedByPlayer.get(player.id) ?? [];
    player.updatedAt = nowIso();
  }
}

function recoverStamina(player, referenceTime) {
  const now = new Date(referenceTime).getTime();
  const lastUpdated = new Date(player.staminaUpdatedAt).getTime();
  const intervalMs = GAME_CONFIG.player.staminaRecoverIntervalSec * 1000;

  if (Number.isNaN(lastUpdated) || now <= lastUpdated) {
    return;
  }

  const steps = Math.floor((now - lastUpdated) / intervalMs);

  if (steps <= 0) {
    return;
  }

  player.stamina = clamp(
    player.stamina + steps * GAME_CONFIG.player.staminaRecoverAmount,
    0,
    GAME_CONFIG.player.staminaMax,
  );
  player.staminaUpdatedAt = new Date(lastUpdated + steps * intervalMs).toISOString();
}

function estimatePlayerAssets(state, player) {
  const ownedTiles = state.tiles.filter((tile) => tile.ownerId === player.id);
  const tileValue = ownedTiles.reduce((sum, tile) => sum + tile.price, 0);
  const buildingValue = ownedTiles.reduce((sum, tile) => {
    if (!tile.building) {
      return sum;
    }

    return sum + getBuildCost(tile.building.type) * tile.building.level;
  }, 0);

  return player.coins + tileValue + buildingValue;
}

function applyRecurringCosts(state, referenceTime) {
  const maintenanceInterval = GAME_CONFIG.building.maintenanceIntervalSec * 1000;
  const taxInterval = GAME_CONFIG.economy.landTaxIntervalSec * 1000;
  const maintenanceLast = new Date(state.world.lastMaintenanceAt).getTime();
  const taxLast = new Date(state.world.lastLandTaxAt).getTime();
  const now = new Date(referenceTime).getTime();

  if (now - maintenanceLast >= maintenanceInterval) {
    const rounds = Math.floor((now - maintenanceLast) / maintenanceInterval);

    for (const player of state.players) {
      const feePerRound = state.tiles.reduce((sum, tile) => {
        if (tile.ownerId !== player.id || !tile.building) {
          return sum;
        }

        return sum + tile.building.level * GAME_CONFIG.building.maintenanceFeePerLevel;
      }, 0);

      if (feePerRound > 0) {
        const total = feePerRound * rounds;
        const paid = Math.min(total, player.coins);
        player.coins -= paid;
        appendLog(
          state,
          `${player.nickname} 支付建筑维护费 ${paid} 金币。`,
          { playerId: player.id, type: "maintenance", amount: -paid },
        );
      }
    }

    state.world.lastMaintenanceAt = new Date(maintenanceLast + rounds * maintenanceInterval).toISOString();
  }

  if (now - taxLast >= taxInterval) {
    const rounds = Math.floor((now - taxLast) / taxInterval);

    for (const player of state.players) {
      const assetEstimate = estimatePlayerAssets(state, player);
      const perRoundTax = Math.floor(assetEstimate * GAME_CONFIG.economy.landTaxRate);

      if (perRoundTax > 0) {
        const total = perRoundTax * rounds;
        const paid = Math.min(total, player.coins);
        player.coins -= paid;
        appendLog(
          state,
          `${player.nickname} 支付地税 ${paid} 金币。`,
          { playerId: player.id, type: "tax", amount: -paid },
        );
      }
    }

    state.world.lastLandTaxAt = new Date(taxLast + rounds * taxInterval).toISOString();
  }
}

function settleProductions(state, referenceTime) {
  const currentTime = new Date(referenceTime).getTime();

  for (const tile of state.tiles) {
    if (!tile.building || tile.building.type !== "factory" || !tile.building.completeAt) {
      continue;
    }

    const completeTime = new Date(tile.building.completeAt).getTime();

    if (Number.isNaN(completeTime) || completeTime > currentTime) {
      continue;
    }

    const player = findPlayer(state, tile.ownerId);

    if (!player) {
      tile.building.startedAt = null;
      tile.building.completeAt = null;
      tile.building.productionItem = null;
      continue;
    }

    const itemName = tile.building.productionItem || "wood";
    player.inventory[itemName] += GAME_CONFIG.production.outputPerBatch;
    appendLog(
      state,
      `${player.nickname} 在 ${tile.name} 完成一批${itemName === "wood" ? "木材" : "砖块"}生产。`,
      {
        playerId: player.id,
        type: "productionComplete",
        amount: GAME_CONFIG.production.outputPerBatch,
        itemName,
        tileId: tile.id,
      },
    );
    tile.building.startedAt = null;
    tile.building.completeAt = null;
    tile.building.productionItem = null;
  }
}

async function mutateState(mutator) {
  const job = mutationQueue.then(async () => {
    const state = await loadState();
    const result = await mutator(state);

    state.world.updatedAt = nowIso();
    syncTileIds(state);
    await persistState(state);
    cache = state;

    return result;
  });

  mutationQueue = job.catch(() => {});

  return job;
}

function applyWorldProgress(state) {
  const timestamp = nowIso();

  for (const player of state.players) {
    recoverStamina(player, timestamp);
  }

  settleProductions(state, timestamp);
  applyRecurringCosts(state, timestamp);
}

function projectState(state, sessionPlayerId) {
  const currentPlayer = sessionPlayerId ? findPlayer(state, sessionPlayerId) : null;
  const playersById = new Map(state.players.map((player) => [player.id, player]));

  return {
    world: {
      worldId: state.world.worldId,
      mapSize: state.world.mapSize,
      config: GAME_CONFIG,
    },
    currentPlayer: currentPlayer
      ? {
          id: currentPlayer.id,
          nickname: currentPlayer.nickname,
          coins: currentPlayer.coins,
          stamina: currentPlayer.stamina,
          position: currentPlayer.position,
          inventory: currentPlayer.inventory,
          tileIds: currentPlayer.tileIds,
          rentIncome: currentPlayer.rentIncome,
          assetEstimate: estimatePlayerAssets(state, currentPlayer),
          assets: state.tiles
            .filter((tile) => tile.ownerId === currentPlayer.id)
            .map((tile) => ({
              tileId: tile.id,
              tileName: tile.name,
              summary: tile.building
                ? `${labelForBuilding(tile.building.type)} Lv.${tile.building.level}`
                : "空地",
            })),
        }
      : null,
    currentTile: currentPlayer
      ? formatTile(state.tiles[currentPlayer.position], playersById)
      : null,
    accounts: state.players.map((player) => ({
      id: player.id,
      nickname: player.nickname,
      coins: player.coins,
      tileCount: player.tileIds.length,
    })),
    tiles: state.tiles.map((tile) => formatTile(tile, playersById)),
    logs: state.transactions.slice(0, 18).map((entry) => ({
      ...entry,
      timestampLabel: formatTimestamp(entry.timestamp),
    })),
  };
}

function labelForBuilding(type) {
  if (type === "residential") {
    return "住宅";
  }

  if (type === "factory") {
    return "工厂";
  }

  return "商店";
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString("zh-CN", {
    hour12: false,
  });
}

function formatTile(tile, playersById) {
  if (!tile) {
    return null;
  }

  return {
    ...tile,
    ownerName: tile.ownerId ? playersById.get(tile.ownerId)?.nickname ?? "未知" : null,
    building: tile.building
      ? {
          ...tile.building,
          label: labelForBuilding(tile.building.type),
          completeAtLabel: tile.building.completeAt
            ? formatTimestamp(tile.building.completeAt)
            : null,
        }
      : null,
  };
}

function requirePlayer(state, playerId) {
  const player = findPlayer(state, playerId);

  if (!player) {
    throw new Error("登录状态已失效，请重新登录");
  }

  return player;
}

function requireTile(state, tileId) {
  const tile = findTile(state, tileId);

  if (!tile) {
    throw new Error("地块不存在");
  }

  return tile;
}

function validateCredentials(nickname, password) {
  const normalizedNickname = String(nickname || "").trim();
  const normalizedPassword = String(password || "");

  if (normalizedNickname.length < 3) {
    throw new Error("昵称至少 3 个字符");
  }

  if (normalizedPassword.length < 6) {
    throw new Error("密码至少 6 位");
  }

  return { nickname: normalizedNickname, password: normalizedPassword };
}

export async function getGameStateForPlayer(sessionPlayerId) {
  return mutateState(async (state) => {
    applyWorldProgress(state);
    return projectState(state, sessionPlayerId);
  });
}

export async function registerPlayer({ nickname, password }) {
  const credentials = validateCredentials(nickname, password);

  return mutateState(async (state) => {
    applyWorldProgress(state);

    if (
      state.players.some(
        (player) => player.nickname.toLowerCase() === credentials.nickname.toLowerCase(),
      )
    ) {
      throw new Error("昵称已存在");
    }

    const player = createPlayerRecord(credentials.nickname, hashPassword(credentials.password));
    state.players.push(player);
    appendLog(state, `${player.nickname} 注册并进入世界。`, {
      playerId: player.id,
      type: "register",
    });

    return player;
  });
}

export async function loginPlayer({ nickname, password }) {
  const credentials = validateCredentials(nickname, password);

  return mutateState(async (state) => {
    applyWorldProgress(state);

    const player = state.players.find(
      (entry) => entry.nickname.toLowerCase() === credentials.nickname.toLowerCase(),
    );

    if (!player || !verifyPassword(credentials.password, player.passwordHash)) {
      throw new Error("昵称或密码错误");
    }

    appendLog(state, `${player.nickname} 登录世界。`, {
      playerId: player.id,
      type: "login",
    });

    return player;
  });
}

function performRoll(state, player) {
  recoverStamina(player, nowIso());

  if (player.stamina < GAME_CONFIG.player.staminaCostRollDice) {
    throw new Error("体力不足，无法掷骰");
  }

  const rolled = Math.floor(Math.random() * 6) + 1;
  console.log('rolled', rolled)
  const previousPosition = player.position;
  const movedSteps = previousPosition + rolled;
  const lapsCompleted = Math.floor(movedSteps / GAME_CONFIG.world.mapSize);
  player.stamina -= GAME_CONFIG.player.staminaCostRollDice;
  player.staminaUpdatedAt = nowIso();
  player.position = movedSteps % GAME_CONFIG.world.mapSize;

  const tile = state.tiles[player.position];
  appendLog(state, `${player.nickname} 掷出 ${rolled} 点，移动到 ${tile.name}。`, {
    playerId: player.id,
    type: "roll",
    tileId: tile.id,
  });

  if (lapsCompleted > 0) {
    const reward = lapsCompleted * GAME_CONFIG.economy.lapRewardCoins;
    player.coins += reward;
    appendLog(state, `${player.nickname} 完成 ${lapsCompleted} 圈，获得 ${reward} 金币。`, {
      playerId: player.id,
      type: "lapReward",
      amount: reward,
    });
  }

  if (
    tile.ownerId &&
    tile.ownerId !== player.id &&
    tile.building?.type === "residential"
  ) {
    const owner = requirePlayer(state, tile.ownerId);
    const rent = GAME_CONFIG.tile.baseRent * tile.building.level;
    const paid = Math.min(rent, player.coins);
    player.coins -= paid;
    owner.coins += paid;
    owner.rentIncome += paid;

    appendLog(state, `${player.nickname} 经过 ${owner.nickname} 的住宅，支付租金 ${paid}。`, {
      playerId: player.id,
      type: "rentPaid",
      amount: -paid,
      tileId: tile.id,
    });
    appendLog(state, `${owner.nickname} 从 ${tile.name} 获得租金 ${paid}。`, {
      playerId: owner.id,
      type: "rentReceived",
      amount: paid,
      tileId: tile.id,
    });
  }
}

function performBuyTile(state, player, tileId) {
  const tile = requireTile(state, tileId);

  if (tile.index !== player.position) {
    throw new Error("只能购买当前所在的地块");
  }

  if (tile.ownerId) {
    throw new Error("该地块已有主人");
  }

  if (player.coins < tile.price) {
    throw new Error("金币不足，无法买地");
  }

  player.coins -= tile.price;
  tile.ownerId = player.id;

  appendLog(state, `${player.nickname} 花费 ${tile.price} 金币买下 ${tile.name}。`, {
    playerId: player.id,
    type: "buyTile",
    amount: -tile.price,
    tileId: tile.id,
  });
}

function performBuild(state, player, tileId, buildingType) {
  const tile = requireTile(state, tileId);

  if (tile.ownerId !== player.id) {
    throw new Error("只能在自己的地块上建造");
  }

  if (tile.building) {
    throw new Error("该地块已有建筑");
  }

  if (!GAME_CONFIG.building.buildCost[buildingType]) {
    throw new Error("建筑类型无效");
  }

  const cost = getBuildCost(buildingType);

  if (player.coins < cost) {
    throw new Error("金币不足，无法建造");
  }

  player.coins -= cost;
  tile.building = {
    id: randomUUID(),
    type: buildingType,
    level: 1,
    startedAt: null,
    completeAt: null,
    productionItem: null,
  };

  appendLog(state, `${player.nickname} 在 ${tile.name} 建造了${labelForBuilding(buildingType)}。`, {
    playerId: player.id,
    type: "build",
    amount: -cost,
    tileId: tile.id,
  });
}

function performUpgrade(state, player, tileId) {
  const tile = requireTile(state, tileId);

  if (tile.ownerId !== player.id || !tile.building) {
    throw new Error("只能升级自己的现有建筑");
  }

  if (tile.building.level >= GAME_CONFIG.building.maxLevel) {
    throw new Error("已达到最高等级");
  }

  const cost = getUpgradeCost(tile.building);

  if (player.coins < cost) {
    throw new Error("金币不足，无法升级");
  }

  player.coins -= cost;
  tile.building.level += 1;

  appendLog(state, `${player.nickname} 将 ${tile.name} 的${labelForBuilding(tile.building.type)}升到 Lv.${tile.building.level}。`, {
    playerId: player.id,
    type: "upgrade",
    amount: -cost,
    tileId: tile.id,
  });
}

function performStartProduction(state, player, tileId, itemName) {
  const tile = requireTile(state, tileId);

  if (tile.ownerId !== player.id || tile.building?.type !== "factory") {
    throw new Error("只能在自己的工厂启动生产");
  }

  if (!["wood", "brick"].includes(itemName)) {
    throw new Error("商品类型无效");
  }

  if (tile.building.completeAt) {
    throw new Error("当前工厂正在生产中");
  }

  const startedAt = nowIso();
  const completeAt = new Date(
    Date.now() + GAME_CONFIG.production.durationSec * 1000,
  ).toISOString();

  tile.building.startedAt = startedAt;
  tile.building.completeAt = completeAt;
  tile.building.productionItem = itemName;

  appendLog(state, `${player.nickname} 在 ${tile.name} 启动${itemName === "wood" ? "木材" : "砖块"}生产。`, {
    playerId: player.id,
    type: "productionStart",
    tileId: tile.id,
    itemName,
  });
}

function performSellItem(state, player, tileId, itemName, quantity) {
  const tile = requireTile(state, tileId);
  const amount = Number(quantity);

  if (tile.ownerId !== player.id || tile.building?.type !== "shop") {
    throw new Error("只能通过自己的商店出售商品");
  }

  if (!["wood", "brick"].includes(itemName)) {
    throw new Error("商品类型无效");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("售卖数量必须是正整数");
  }

  if (player.inventory[itemName] < amount) {
    throw new Error("库存不足");
  }

  const gross = GAME_CONFIG.market.systemPrices[itemName] * amount;
  const fee = Math.floor(gross * GAME_CONFIG.market.tradeFeeRate);
  const net = gross - fee;

  player.inventory[itemName] -= amount;
  player.coins += net;

  appendLog(state, `${player.nickname} 通过 ${tile.name} 卖出 ${amount} 单位${itemName === "wood" ? "木材" : "砖块"}，净收入 ${net}。`, {
    playerId: player.id,
    type: "sell",
    amount: net,
    tileId: tile.id,
    itemName,
  });
}

export async function performPlayerAction(playerId, payload) {
  return mutateState(async (state) => {
    applyWorldProgress(state);
    const player = requirePlayer(state, playerId);

    switch (payload.action) {
      case "roll":
        performRoll(state, player);
        break;
      case "buyTile":
        performBuyTile(state, player, payload.tileId);
        break;
      case "build":
        performBuild(state, player, payload.tileId, payload.buildingType);
        break;
      case "upgrade":
        performUpgrade(state, player, payload.tileId);
        break;
      case "startProduction":
        performStartProduction(state, player, payload.tileId, payload.itemName);
        break;
      case "sellItem":
        performSellItem(state, player, payload.tileId, payload.itemName, payload.quantity);
        break;
      default:
        throw new Error("未知操作");
    }

    return { state: projectState(state, playerId) };
  });
}

