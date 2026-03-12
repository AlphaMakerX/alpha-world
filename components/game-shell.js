"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

const BUILDING_OPTIONS = [
  { value: "residential", label: "住宅" },
  { value: "factory", label: "工厂" },
  { value: "shop", label: "商店" },
];

const ITEM_OPTIONS = [
  { value: "wood", label: "木材" },
  { value: "brick", label: "砖块" },
];

const TILE_POSITIONS = [
  { x: 8, y: 12 },
  { x: 22, y: 12 },
  { x: 36, y: 12 },
  { x: 50, y: 12 },
  { x: 64, y: 12 },
  { x: 78, y: 12 },
  { x: 92, y: 12 },
  { x: 92, y: 31 },
  { x: 92, y: 50 },
  { x: 92, y: 69 },
  { x: 92, y: 88 },
  { x: 78, y: 88 },
  { x: 64, y: 88 },
  { x: 50, y: 88 },
  { x: 36, y: 88 },
  { x: 22, y: 88 },
  { x: 8, y: 88 },
  { x: 8, y: 69 },
  { x: 8, y: 50 },
  { x: 8, y: 31 },
];

function getTilePosition(index, total) {
  if (total !== TILE_POSITIONS.length) {
    const fallbackStep = 84 / Math.max(total - 1, 1);

    return {
      left: `${8 + index * fallbackStep}%`,
      top: "88%",
    };
  }

  return {
    left: `${TILE_POSITIONS[index].x}%`,
    top: `${TILE_POSITIONS[index].y}%`,
  };
}

function getBoardPath(total) {
  const points = (total === TILE_POSITIONS.length ? TILE_POSITIONS : []).map(
    ({ x, y }) => `${x},${y}`,
  );

  if (points.length === 0) {
    return "";
  }

  points.push(points[0]);

  return points.join(" ");
}

async function loadGameState() {
  const response = await fetch("/api/game/state", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "无法加载游戏状态");
  }

  return payload;
}

async function runAction(action, payload = {}) {
  const response = await fetch("/api/game/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "操作失败");
  }

  return data.state;
}

function extractRollValue(logs, playerId) {
  const latestRoll = logs.find(
    (entry) => entry.type === "roll" && (!playerId || entry.playerId === playerId),
  );

  if (!latestRoll) {
    return null;
  }

  const matched = latestRoll.message.match(/掷出\s*(\d+)\s*点/);
  const rolled = Number(matched?.[1]);

  return Number.isInteger(rolled) ? rolled : null;
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getDicePips(value) {
  switch (value) {
    case 1:
      return [4];
    case 2:
      return [0, 8];
    case 3:
      return [0, 4, 8];
    case 4:
      return [0, 2, 6, 8];
    case 5:
      return [0, 2, 4, 6, 8];
    case 6:
      return [0, 2, 3, 5, 6, 8];
    default:
      return [];
  }
}

export default function GameShell() {
  const [game, setGame] = useState(null);
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [selectedBuildType, setSelectedBuildType] = useState("residential");
  const [selectedProductionItem, setSelectedProductionItem] = useState("wood");
  const [sellItem, setSellItem] = useState("wood");
  const [sellQuantity, setSellQuantity] = useState("1");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [diceValue, setDiceValue] = useState(null);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [isPieceMoving, setIsPieceMoving] = useState(false);
  const [displayPosition, setDisplayPosition] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function refresh() {
      if (isDiceRolling || isPieceMoving) {
        return;
      }

      try {
        const state = await loadGameState();

        if (!active) {
          return;
        }

        setGame(state);
        setSelectedTileId((current) => current ?? state.currentTile?.id ?? null);
        setDiceValue((current) =>
          current ?? extractRollValue(state.logs, state.currentPlayer?.id),
        );
        setDisplayPosition(state.currentPlayer?.position ?? null);
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      }
    }

    refresh();
    const timer = setInterval(refresh, 4000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isDiceRolling, isPieceMoving]);

  const selectedTile = useMemo(() => {
    if (!game || !selectedTileId) {
      return null;
    }

    return game.tiles.find((tile) => tile.id === selectedTileId) ?? null;
  }, [game, selectedTileId]);

  async function mutate(action, payload, successText) {
    setError("");
    const nextState = await runAction(action, payload);
    setGame(nextState);
    setFeedback(successText);
  }

  function run(action, payload, successText) {
    startTransition(async () => {
      try {
        await mutate(action, payload, successText);
      } catch (actionError) {
        setError(actionError.message);
      }
    });
  }

  function handleRoll() {
    if (isPending || isDiceRolling || isPieceMoving || !game?.currentPlayer) {
      return;
    }

    const startPosition = game.currentPlayer.position;
    const mapSize = game.tiles.length;

    setError("");
    setFeedback("");
    setIsDiceRolling(true);
    setDiceValue(Math.floor(Math.random() * 6) + 1);
    setDisplayPosition(startPosition);

    const rollingTimer = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 95);

    startTransition(async () => {
      try {
        await sleep(900);
        const nextState = await runAction("roll", {});
        const rolled = extractRollValue(nextState.logs, nextState.currentPlayer?.id);
        setDiceValue(rolled ?? null);
        setIsDiceRolling(false);
        clearInterval(rollingTimer);

        if (rolled && mapSize > 0) {
          setIsPieceMoving(true);

          for (let step = 1; step <= rolled; step += 1) {
            await sleep(260);
            setDisplayPosition((startPosition + step) % mapSize);
          }
        }

        setGame(nextState);
        setDisplayPosition(nextState.currentPlayer?.position ?? null);
        setFeedback("已完成掷骰");
      } catch (actionError) {
        setError(actionError.message);
      } finally {
        clearInterval(rollingTimer);
        setIsDiceRolling(false);
        setIsPieceMoving(false);
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    });
  }

  if (!game?.currentPlayer) {
    return (
      <main className="game-shell loading-shell">
        <div className="panel loading-panel">
          <h1>读取世界状态中</h1>
          <p>{error || "正在同步本地 JSON 存档..."}</p>
          <Link href="/login" className="primary-link">
            返回登录页
          </Link>
        </div>
      </main>
    );
  }

  const { currentPlayer, currentTile, logs, world } = game;
  const ownedShops = game.tiles.filter(
    (tile) => tile.ownerId === currentPlayer.id && tile.building?.type === "shop",
  );
  const canBuyCurrentTile =
    currentTile?.ownerId === null && currentTile?.id === selectedTile?.id;
  const canBuildHere =
    selectedTile?.ownerId === currentPlayer.id && !selectedTile?.building;
  const canUpgradeHere =
    selectedTile?.ownerId === currentPlayer.id &&
    selectedTile?.building &&
    selectedTile.building.level < world.config.building.maxLevel;
  const canStartProduction =
    selectedTile?.ownerId === currentPlayer.id &&
    selectedTile?.building?.type === "factory" &&
    !selectedTile.building.completeAt;
  const canSellHere =
    selectedTile?.ownerId === currentPlayer.id &&
    selectedTile?.building?.type === "shop";
  const activePips = new Set(getDicePips(diceValue));
  const markerPosition = displayPosition ?? currentPlayer.position;
  const markerTile = game.tiles[markerPosition] ?? currentTile;
  const isActionLocked = isPending || isDiceRolling || isPieceMoving;

  return (
    <main className="game-shell">
      <header className="game-header">
        <div>
          <p className="eyebrow">Alpha World</p>
          <h1>{currentPlayer.nickname} 的地产回合</h1>
        </div>

        <div className="header-actions">
          <Link href="/login" className="ghost-link">
            切换账号
          </Link>
          <button type="button" className="button button-ghost" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>

      <section className="hero-band">
        <div className="hero-card">
          <span>金币</span>
          <strong>{currentPlayer.coins}</strong>
        </div>
        <div className="hero-card">
          <span>体力</span>
          <strong>
            {currentPlayer.stamina} / {world.config.player.staminaMax}
          </strong>
        </div>
        <div className="hero-card">
          <span>当前位置</span>
          <strong>
            第 {markerPosition + 1} 格 · {markerTile.name}
          </strong>
        </div>
        <div className="hero-card">
          <span>持有地块</span>
          <strong>{currentPlayer.tileIds.length}</strong>
        </div>
      </section>

      <section className="board-panel panel">
        <div className="panel-head board-head">
          <div>
            <h2>路径地图</h2>
            <p>20 格单环路径。点击格子查看详情；掷骰后自动结算住宅租金。</p>
          </div>
          <div className="board-actions">
            <div
              className={`dice-display${isDiceRolling ? " rolling" : ""}`}
              role="status"
              aria-live="polite"
              aria-label="当前掷骰结果"
            >
              <span>骰子点数</span>
              <div className="dice-face" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, pipIndex) => (
                  <i
                    key={pipIndex}
                    className={`dice-pip${activePips.has(pipIndex) ? " active" : ""}`}
                  />
                ))}
              </div>
              <strong className="dice-point-label">{diceValue ?? "-"}</strong>
            </div>
            <button
              type="button"
              className="button button-primary"
              disabled={isActionLocked}
              onClick={handleRoll}
            >
              {isDiceRolling
                ? "骰子滚动中..."
                : isPieceMoving
                  ? "角色移动中..."
                  : isPending
                    ? "处理中..."
                    : "掷骰移动"}
            </button>
          </div>
        </div>

        <div className="loop-board-wrap">
          <div className="loop-board">
            {game.tiles.map((tile) => {
              const isCurrent = tile.index === markerPosition;
              const isSelected = tile.id === selectedTileId;
              const position = getTilePosition(tile.index, game.tiles.length);

              return (
                <button
                  key={tile.id}
                  type="button"
                  className={`tile-card${isCurrent ? " current" : ""}${isSelected ? " selected" : ""}`}
                  style={position}
                  disabled={isActionLocked}
                  onClick={() => setSelectedTileId(tile.id)}
                >
                  <span className="tile-index">{tile.index + 1}</span>
                  <strong>{tile.name}</strong>
                  <span>{tile.ownerName || "无主地块"}</span>
                  <span>{tile.building ? tile.building.label : "未建造"}</span>
                  {isCurrent ? (
                    <div className="player-marker" aria-label="current player">
                      <span>{currentPlayer.nickname.slice(0, 1).toUpperCase()}</span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <aside className="panel player-panel">
          <div className="panel-head">
            <h2>玩家面板</h2>
            <p>查看资产、库存和名下建筑。</p>
          </div>

          <dl className="stats-grid">
            <div>
              <dt>木材</dt>
              <dd>{currentPlayer.inventory.wood}</dd>
            </div>
            <div>
              <dt>砖块</dt>
              <dd>{currentPlayer.inventory.brick}</dd>
            </div>
            <div>
              <dt>资产估值</dt>
              <dd>{currentPlayer.assetEstimate}</dd>
            </div>
            <div>
              <dt>最近租金收入</dt>
              <dd>{currentPlayer.rentIncome}</dd>
            </div>
          </dl>

          <div className="owned-assets">
            {currentPlayer.assets.map((asset) => (
              <button
                key={asset.tileId}
                type="button"
                className="owned-asset"
                disabled={isActionLocked}
                onClick={() => setSelectedTileId(asset.tileId)}
              >
                <strong>{asset.tileName}</strong>
                <span>{asset.summary}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel detail-panel">
          <div className="panel-head">
            <h2>地块详情</h2>
            <p>当前选中的格子会在这里展示可执行动作。</p>
          </div>

          {selectedTile ? (
            <>
              <div className="detail-summary">
                <p>
                  <strong>{selectedTile.name}</strong>
                </p>
                <p>所有者：{selectedTile.ownerName || "无"}</p>
                <p>价格：{selectedTile.price}</p>
                <p>
                  建筑：
                  {selectedTile.building
                    ? `${selectedTile.building.label} Lv.${selectedTile.building.level}`
                    : "暂无"}
                </p>
                {selectedTile.building?.completeAt ? (
                  <p>生产完成时间：{selectedTile.building.completeAtLabel}</p>
                ) : null}
              </div>

              <div className="action-stack">
                {canBuyCurrentTile ? (
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={isActionLocked}
                    onClick={() =>
                      run("buyTile", { tileId: selectedTile.id }, "已购买地块")
                    }
                  >
                    购买当前地块
                  </button>
                ) : null}

                {canBuildHere ? (
                  <div className="inline-form">
                    <select
                      value={selectedBuildType}
                      disabled={isActionLocked}
                      onChange={(event) => setSelectedBuildType(event.target.value)}
                    >
                      {BUILDING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={isActionLocked}
                      onClick={() =>
                        run(
                          "build",
                          { tileId: selectedTile.id, buildingType: selectedBuildType },
                          "已完成建造",
                        )
                      }
                    >
                      建造
                    </button>
                  </div>
                ) : null}

                {canUpgradeHere ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={isActionLocked}
                    onClick={() =>
                      run("upgrade", { tileId: selectedTile.id }, "已升级建筑")
                    }
                  >
                    升级建筑
                  </button>
                ) : null}

                {canStartProduction ? (
                  <div className="inline-form">
                    <select
                      value={selectedProductionItem}
                      disabled={isActionLocked}
                      onChange={(event) =>
                        setSelectedProductionItem(event.target.value)
                      }
                    >
                      {ITEM_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={isActionLocked}
                      onClick={() =>
                        run(
                          "startProduction",
                          {
                            tileId: selectedTile.id,
                            itemName: selectedProductionItem,
                          },
                          "已启动生产",
                        )
                      }
                    >
                      启动生产
                    </button>
                  </div>
                ) : null}

                {canSellHere ? (
                  <div className="inline-form">
                    <select
                      value={sellItem}
                      disabled={isActionLocked}
                      onChange={(event) => setSellItem(event.target.value)}
                    >
                      {ITEM_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={sellQuantity}
                      disabled={isActionLocked}
                      onChange={(event) => setSellQuantity(event.target.value)}
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={isActionLocked}
                      onClick={() =>
                        run(
                          "sellItem",
                          {
                            tileId: selectedTile.id,
                            itemName: sellItem,
                            quantity: Number(sellQuantity),
                          },
                          "已完成售卖",
                        )
                      }
                    >
                      卖给系统
                    </button>
                  </div>
                ) : null}

                {selectedTile.ownerId === currentPlayer.id &&
                ownedShops.length === 0 &&
                selectedTile.building?.type !== "shop" ? (
                  <p className="helper-copy">
                    想卖货时，需要先在自己的地块建造一间商店。
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <p>请选择地图格子。</p>
          )}
        </section>

        <aside className="panel logs-panel">
          <div className="panel-head">
            <h2>交易 / 日志</h2>
            <p>最近 18 条关键事件。</p>
          </div>

          <div className="log-list">
            {logs.map((log) => (
              <article key={log.id} className="log-item">
                <strong>{log.message}</strong>
                <span>{log.timestampLabel}</span>
              </article>
            ))}
          </div>
        </aside>
      </section>

      {error ? <p className="message error">{error}</p> : null}
      {feedback ? <p className="message success">{feedback}</p> : null}
    </main>
  );
}
