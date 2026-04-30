/**
 * 世界地图会话管理 Hook
 *
 * 整合用户认证状态、个人数据查询、背包数据查询、
 * 位置更新 mutation 和登出逻辑。登出时会尝试保存
 * 最新玩家位置，然后清除缓存并刷新页面。
 */
"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { MessageInstance } from "antd/es/message/interface";
import { useState, type MutableRefObject } from "react";
import { trpc } from "@/client/lib/trpc";

/** 用户会话、个人数据与登出逻辑管理 Hook */
export function useWorldMapSession(options: {
  messageApi: MessageInstance;
  pendingPlayerPositionRef: MutableRefObject<{ x: number; y: number } | null>;
  lastSyncedPlayerPositionRef: MutableRefObject<{ x: number; y: number } | null>;
}) {
  const { messageApi, pendingPlayerPositionRef, lastSyncedPlayerPositionRef } = options;
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const trpcUtils = trpc.useUtils();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const {
    data: meData,
    isLoading: isMeLoading,
    isFetching: isMeFetching,
  } = trpc.person.me.useQuery(undefined, { enabled: authStatus === "authenticated" });

  const updatePositionMutation = trpc.person.updatePosition.useMutation();

  const {
    data: inventoryData,
    isFetching: inventoryLoading,
    refetch: refetchInventory,
  } = trpc.inventory.mine.useQuery(undefined, {
    enabled: authStatus === "authenticated",
  });

  const currentUserId = authStatus === "authenticated" ? meData?.user.id : undefined;
  const playerPosition = authStatus === "authenticated" ? meData?.user.position : undefined;

  const headerUsername =
    authStatus === "authenticated"
      ? (meData?.user.username ?? session?.user?.name ?? undefined)
      : undefined;
  const headerMoney = authStatus === "authenticated" ? meData?.user.money : 0;
  const headerStamina = authStatus === "authenticated" ? meData?.user.stamina : undefined;

  /** 登出流程：先保存位置 -> 调用 signOut -> 清除缓存 -> 刷新页面 */
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const latestPosition = pendingPlayerPositionRef.current;
      if (latestPosition && authStatus === "authenticated") {
        try {
          const result = await updatePositionMutation.mutateAsync({ position: latestPosition });
          lastSyncedPlayerPositionRef.current = result.user.position;
          pendingPlayerPositionRef.current = null;
        } catch {
          // 下线前保存位置失败时不阻塞登出流程。
        }
      }
      await signOut({ redirect: false });
      await Promise.all([trpcUtils.person.me.invalidate(), trpcUtils.plot.list.invalidate()]);
      router.refresh();
      messageApi.success("已登出");
    } finally {
      setLogoutLoading(false);
    }
  };

  return {
    authStatus,
    meData,
    isMeLoading,
    isMeFetching,
    updatePositionMutation,
    inventoryData,
    inventoryLoading,
    refetchInventory,
    currentUserId,
    playerPosition,
    headerUsername,
    headerMoney,
    headerStamina,
    logoutLoading,
    handleLogout,
    trpcUtils,
  };
}
