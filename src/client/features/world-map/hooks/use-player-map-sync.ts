/**
 * 玩家位置与地图数据同步 Hook
 *
 * 承担两个职责：
 * 1. 定时将本地玩家位置上传到服务端（节流式同步）
 * 2. 当地图数据或玩家位置发生变化时，通过事件推送给 Phaser 场景
 */
"use client";

import { useEffect, type MutableRefObject, type RefObject } from "react";
import { WORLD_MAP_SYNC_EVENT } from "../components/world-map-scene";
import { POSITION_SYNC_INTERVAL_MS } from "../world-map-constants";
import type { WorldMapRenderablePlot } from "../rendering/world-map-plot";

/** 位置更新 mutation 的类型约束 */
type UpdatePositionMutation = {
  isPending: boolean;
  mutateAsync: (input: { position: { x: number; y: number } }) => Promise<{
    user: { position: { x: number; y: number } };
  }>;
};

/** 管理玩家位置的定时上传和地图数据向 Phaser 场景的同步 */
export function usePlayerMapSync(options: {
  authStatus: "loading" | "authenticated" | "unauthenticated";
  currentUserId: string | undefined;
  playerPosition: { x: number; y: number } | undefined;
  worldMapPlots: WorldMapRenderablePlot[];
  worldMapPlotsKey: string;
  isGameReady: boolean;
  gameRef: RefObject<import("phaser").Game | null>;
  updatePositionMutation: UpdatePositionMutation;
  pendingPlayerPositionRef: MutableRefObject<{ x: number; y: number } | null>;
  lastSyncedPlayerPositionRef: MutableRefObject<{ x: number; y: number } | null>;
  isAuthenticatedRef: MutableRefObject<boolean>;
}) {
  const {
    authStatus,
    currentUserId,
    playerPosition,
    worldMapPlots,
    worldMapPlotsKey,
    isGameReady,
    gameRef,
    updatePositionMutation,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
    isAuthenticatedRef,
  } = options;

  // 将认证状态同步到 ref，供 Phaser 回调中读取
  useEffect(() => {
    isAuthenticatedRef.current = authStatus === "authenticated";
  }, [authStatus, isAuthenticatedRef]);

  // 登出时清空待同步和已同步的位置记录
  useEffect(() => {
    if (authStatus !== "authenticated" || !currentUserId) {
      pendingPlayerPositionRef.current = null;
      lastSyncedPlayerPositionRef.current = null;
      return;
    }
    if (playerPosition) {
      lastSyncedPlayerPositionRef.current = playerPosition;
    }
  }, [authStatus, currentUserId, playerPosition?.x, playerPosition?.y, pendingPlayerPositionRef, lastSyncedPlayerPositionRef]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !currentUserId) {
      return;
    }

    // 定时轮询将待同步位置上传到服务端
    const timer = window.setInterval(() => {
      const pendingPosition = pendingPlayerPositionRef.current;
      if (!pendingPosition || updatePositionMutation.isPending) {
        return;
      }
      void updatePositionMutation
        .mutateAsync({ position: pendingPosition })
        .then((result) => {
          lastSyncedPlayerPositionRef.current = result.user.position;
          pendingPlayerPositionRef.current = null;
          // 位置回包用于确认已落库，不在这里反向驱动本地角色，避免连续移动时被旧坐标回拉。
        })
        .catch(() => {
          // 定时同步失败时保留待同步坐标，等待下一轮重试。
        });
    }, POSITION_SYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    authStatus,
    currentUserId,
    updatePositionMutation,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
  ]);

  // 当地块数据、用户 ID 或玩家位置变化时，通过事件推送给 Phaser 场景
  useEffect(() => {
    if (!isGameReady || !gameRef.current) {
      return;
    }

    gameRef.current.events.emit(WORLD_MAP_SYNC_EVENT, {
      plots: worldMapPlots,
      currentUserId,
      playerPosition,
    });
  }, [
    isGameReady,
    worldMapPlots,
    worldMapPlotsKey,
    currentUserId,
    playerPosition?.x,
    playerPosition?.y,
    gameRef,
  ]);
}
