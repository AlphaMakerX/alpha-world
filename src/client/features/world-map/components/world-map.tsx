"use client";

import { useEffect, useRef } from "react";
import { createWorldMapScene } from "./world-map-scene";


export function WorldMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapPhaser() {
      if (!containerRef.current || gameRef.current) {
        return;
      }

      const Phaser = (await import("phaser")).default;

      const WorldMapScene = createWorldMapScene(Phaser);

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
  }, []);

  return (
    <section className="h-dvh w-screen">
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden bg-slate-100"
      />
    </section>
  );
}
