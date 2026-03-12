"use client";

import { Modal, message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { createWorldMapScene } from "./world-map-scene";
import { WorldMapHeader } from "./world-map-header";
import { trpc } from "@/client/lib/trpc";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthPanel } from "@/client/features/auth/components/auth-panel";
import { PlotDetailModal } from "./plot-detail-modal";


export function WorldMap() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [messageApi, contextHolder] = message.useMessage();
  const trpcUtils = trpc.useUtils();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const { data } = trpc.plot.list.useQuery();
  const { data: meData } = trpc.person.me.useQuery(undefined, {
    enabled: authStatus === "authenticated",
  });
  const purchaseMutation = trpc.plot.purchase.useMutation();
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  type PlotItem = NonNullable<typeof data>["plots"][number];

  const existingPlotIds = new Set(
    (data?.plots ?? []).map((plot) => `P${plot.x}-${String(plot.y).padStart(2, "0")}`),
  );
  const existingPlotIdsKey = Array.from(existingPlotIds).sort().join("|");
  const plotById = useMemo(() => {
    const map = new Map<string, PlotItem>();
    for (const plot of data?.plots ?? []) {
      map.set(`P${plot.x}-${String(plot.y).padStart(2, "0")}`, plot);
    }
    return map;
  }, [data?.plots]);
  const selectedPlot = selectedPlotId ? plotById.get(selectedPlotId) : undefined;
  const canPurchaseSelectedPlot = Boolean(selectedPlot?.ownerUserId == null);
  const headerUsername =
    authStatus === "authenticated" ? (meData?.user.username ?? session?.user?.name ?? undefined) : undefined;
  const headerMoney = authStatus === "authenticated" ? meData?.user.money : 0;

  const handlePurchase = async () => {
    if (!selectedPlot) {
      return;
    }
    if (authStatus !== "authenticated") {
      setLoginModalOpen(true);
      return;
    }

    try {
      await purchaseMutation.mutateAsync({ plotId: selectedPlot.id });
      await Promise.all([trpcUtils.plot.list.invalidate(), trpcUtils.person.me.invalidate()]);
      messageApi.success("购买成功");
      setSelectedPlotId(null);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "购买失败，请稍后重试");
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut({ redirect: false });
      await Promise.all([trpcUtils.person.me.invalidate(), trpcUtils.plot.list.invalidate()]);
      router.refresh();
      messageApi.success("已登出");
    } finally {
      setLogoutLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function bootstrapPhaser() {
      if (!containerRef.current) {
        return;
      }

      gameRef.current?.destroy(true);
      gameRef.current = null;

      const Phaser = (await import("phaser")).default;

      const WorldMapScene = createWorldMapScene(Phaser, {
        existingPlotIds,
        onOpenExistingPlot: (plotId) => {
          setSelectedPlotId((prev) => (prev === plotId ? null : plotId));
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
          default: 'arcade',
          arcade: {
            // gravity: { x: 0, y: 300 },
            debug: false
          }
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
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [existingPlotIdsKey]);

  return (
    <section className="flex h-dvh w-screen flex-col">
      {contextHolder}
      <WorldMapHeader
        authStatus={authStatus}
        username={headerUsername}
        money={headerMoney}
        onLoginClick={() => setLoginModalOpen(true)}
        onLogoutClick={() => void handleLogout()}
        logoutLoading={logoutLoading}
      />
      <div
        ref={containerRef}
        className="min-h-0 w-full flex-1 overflow-hidden bg-slate-100"
      />
      <PlotDetailModal
        selectedPlotId={selectedPlotId}
        selectedPlot={
          selectedPlot
            ? {
                id: String(selectedPlot.id),
                status: String(selectedPlot.status),
                price: selectedPlot.price,
                ownerUserId: selectedPlot.ownerUserId,
              }
            : undefined
        }
        canPurchaseSelectedPlot={canPurchaseSelectedPlot}
        purchaseLoading={purchaseMutation.isPending}
        onClose={() => setSelectedPlotId(null)}
        onPurchase={() => void handlePurchase()}
      />
      <Modal
        title="登录后可购买地块"
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <AuthPanel onAuthSuccess={() => setLoginModalOpen(false)} />
      </Modal>
    </section>
  );
}
