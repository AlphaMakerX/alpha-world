"use client";

import { useEffect, type MutableRefObject, type RefObject } from "react";
import { WORLD_MAP_SYNC_EVENT } from "../components/world-map-scene";
import type { PlayerStaminaPayload } from "../components/world-map-scene";
import { DEFAULT_PLAYER_STAMINA, POSITION_SYNC_INTERVAL_MS } from "../world-map-constants";
import type { WorldMapRenderablePlot } from "../rendering/world-map-plot";

type UpdatePositionMutation = {
  isPending: boolean;
  mutateAsync: (input: { position: { x: number; y: number } }) => Promise<{
    user: { position: { x: number; y: number }; stamina: PlayerStaminaPayload };
  }>;
};

export function usePlayerMapSync(options: {
  authStatus: "loading" | "authenticated" | "unauthenticated";
  currentUserId: string | undefined;
  playerPosition: { x: number; y: number } | undefined;
  serverPlayerStamina: PlayerStaminaPayload | undefined;
  worldMapPlots: WorldMapRenderablePlot[];
  worldMapPlotsKey: string;
  isGameReady: boolean;
  gameRef: RefObject<import("phaser").Game | null>;
  setPlayerStamina: React.Dispatch<React.SetStateAction<PlayerStaminaPayload>>;
  updatePositionMutation: UpdatePositionMutation;
  pendingPlayerPositionRef: MutableRefObject<{ x: number; y: number } | null>;
  lastSyncedPlayerPositionRef: MutableRefObject<{ x: number; y: number } | null>;
  isAuthenticatedRef: MutableRefObject<boolean>;
}) {
  const {
    authStatus,
    currentUserId,
    playerPosition,
    serverPlayerStamina,
    worldMapPlots,
    worldMapPlotsKey,
    isGameReady,
    gameRef,
    setPlayerStamina,
    updatePositionMutation,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
    isAuthenticatedRef,
  } = options;

  useEffect(() => {
    isAuthenticatedRef.current = authStatus === "authenticated";
  }, [authStatus, isAuthenticatedRef]);

  useEffect(() => {
    if (serverPlayerStamina) {
      setPlayerStamina(serverPlayerStamina);
      return;
    }
    if (authStatus !== "authenticated") {
      setPlayerStamina(DEFAULT_PLAYER_STAMINA);
    }
  }, [authStatus, serverPlayerStamina?.current, serverPlayerStamina?.max, setPlayerStamina]);

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

    const timer = window.setInterval(() => {
      const pendingPosition = pendingPlayerPositionRef.current;
      if (!pendingPosition || updatePositionMutation.isPending) {
        return;
      }
      void updatePositionMutation
        .mutateAsync({ position: pendingPosition })
        .then((result) => {
          lastSyncedPlayerPositionRef.current = result.user.position;
          setPlayerStamina(result.user.stamina);
          pendingPlayerPositionRef.current = null;
          if (isGameReady && gameRef.current) {
            gameRef.current.events.emit(WORLD_MAP_SYNC_EVENT, {
              plots: worldMapPlots,
              currentUserId,
              playerPosition: result.user.position,
              playerStamina: result.user.stamina,
            });
          }
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
    isGameReady,
    updatePositionMutation,
    worldMapPlots,
    gameRef,
    pendingPlayerPositionRef,
    lastSyncedPlayerPositionRef,
    setPlayerStamina,
  ]);

  useEffect(() => {
    if (!isGameReady || !gameRef.current) {
      return;
    }

    gameRef.current.events.emit(WORLD_MAP_SYNC_EVENT, {
      plots: worldMapPlots,
      currentUserId,
      playerPosition,
      playerStamina: serverPlayerStamina,
    });
  }, [
    isGameReady,
    worldMapPlots,
    worldMapPlotsKey,
    currentUserId,
    playerPosition?.x,
    playerPosition?.y,
    serverPlayerStamina?.current,
    serverPlayerStamina?.max,
    gameRef,
  ]);
}
