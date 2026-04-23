/**
 * Phaser 游戏引擎初始化与生命周期管理 Hook
 *
 * 在世界数据首屏加载完成后动态导入 Phaser，创建游戏实例和场景。
 * 组件卸载时自动销毁游戏实例，避免内存泄漏。
 * 场景运行后通过事件（WORLD_MAP_SYNC_EVENT）接收数据更新，
 * 不会因为数据变化而重建 Phaser 实例。
 */
"use client";

import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from "react";
import { createWorldMapScene } from "../components/world-map-scene";
import { MAP_MAX_X, MAP_MAX_Y, POSITION_MIN_DISTANCE_TO_SYNC } from "../world-map-constants";
import { getDistance } from "../world-map-utils";
import type { WorldMapRenderablePlot } from "../rendering/world-map-plot";

/** 初始化并管理 Phaser 游戏引擎实例 */
export function usePhaserWorldMap(options: {
  containerRef: RefObject<HTMLDivElement | null>;
  isInitialWorldDataLoading: boolean;
  worldMapPlots: WorldMapRenderablePlot[];
  currentUserId: string | undefined;
  playerPosition: { x: number; y: number } | undefined;
  setSelectedPlotId: Dispatch<SetStateAction<string | null>>;
  pendingPlayerPositionRef: MutableRefObject<{ x: number; y: number } | null>;
  lastSyncedPlayerPositionRef: MutableRefObject<{ x: number; y: number } | null>;
  isAuthenticatedRef: MutableRefObject<boolean>;
}) {
  const {
    containerRef,
    isInitialWorldDataLoading,
    worldMapPlots,
    currentUserId,
    playerPosition,
    setSelectedPlotId,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
    isAuthenticatedRef,
  } = options;

  const gameRef = useRef<import("phaser").Game | null>(null);
  const hasInitializedSceneRef = useRef(false);
  const [isGameReady, setIsGameReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (isInitialWorldDataLoading || hasInitializedSceneRef.current) {
      return;
    }
    hasInitializedSceneRef.current = true;

    /** 动态导入 Phaser 并创建游戏实例 */
    async function bootstrapPhaser() {
      if (!containerRef.current) {
        return;
      }

      gameRef.current?.destroy(true);
      gameRef.current = null;

      const Phaser = (await import("phaser")).default;

      const WorldMapScene = createWorldMapScene(Phaser, {
        plots: worldMapPlots,
        currentUserId,
        playerPosition,
        onPlayerPositionChange: (position) => {
          // 未登录时不同步位置
          if (!isAuthenticatedRef.current) {
            return;
          }
          // 将位置限制在地图边界内并保留两位小数
          const clampedPosition = {
            x: Number(Math.max(0, Math.min(MAP_MAX_X, position.x)).toFixed(2)),
            y: Number(Math.max(0, Math.min(MAP_MAX_Y, position.y)).toFixed(2)),
          };
          // 与上次同步位置相同则跳过
          const lastSynced = lastSyncedPlayerPositionRef.current;
          if (lastSynced && lastSynced.x === clampedPosition.x && lastSynced.y === clampedPosition.y) {
            return;
          }
          // 移动距离未超过最小同步阈值则不更新待同步位置
          const baselinePosition = pendingPlayerPositionRef.current ?? lastSynced;
          if (
            baselinePosition &&
            getDistance(baselinePosition, clampedPosition) < POSITION_MIN_DISTANCE_TO_SYNC
          ) {
            return;
          }
          pendingPlayerPositionRef.current = clampedPosition;
        },
        onOpenExistingPlot: (plotId) => {
          setSelectedPlotId((prev) => (prev === plotId ? null : plotId));
        },
        onSceneReady: () => {
          if (!cancelled) {
            setIsGameReady(true);
          }
        },
      });

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        backgroundColor: "#d9f99d",
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.NO_CENTER,
          width: "100%",
          height: "100%",
        },
        physics: {
          default: "arcade",
          arcade: {
            debug: false,
          },
        },
        scene: [WorldMapScene],
      });

      if (cancelled) {
        game.destroy(true);
        return;
      }

      gameRef.current = game;
    }

    void bootstrapPhaser();

    return () => {
      cancelled = true;
      hasInitializedSceneRef.current = false;
      gameRef.current?.destroy(true);
      gameRef.current = null;
      setIsGameReady(false);
    };
    // 与原先一致：仅在「世界数据首屏加载完成」门闩变化时重建 Phaser；场景数据靠 WORLD_MAP_SYNC_EVENT 更新。
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional bootstrap gate only
  }, [isInitialWorldDataLoading]);

  return { gameRef, isGameReady };
}
