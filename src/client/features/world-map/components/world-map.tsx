"use client";

import { Modal } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { createWorldMapScene } from "./world-map-scene";
import { trpc } from "@/client/lib/trpc";


export function WorldMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const { data } = trpc.plot.list.useQuery();
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
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
    <section className="h-dvh w-screen">
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden bg-slate-100"
      />
      <Modal
        title={selectedPlotId ? `地块详情 - ${selectedPlotId}` : "地块详情"}
        open={Boolean(selectedPlot)}
        onCancel={() => setSelectedPlotId(null)}
        onOk={() => setSelectedPlotId(null)}
        destroyOnHidden
      >
        {selectedPlot ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>地块数据库 ID: {selectedPlot.id}</p>
            <p>状态: {selectedPlot.status}</p>
            <p>价格: {selectedPlot.price}</p>
            <p>拥有者: {selectedPlot.ownerUserId ?? "无"}</p>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
