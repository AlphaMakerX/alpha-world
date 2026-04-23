/**
 * 应用首页
 * 渲染全屏的世界地图组件，作为游戏的主入口页面。
 */

import { WorldMap } from "@/client/features/world-map/components/world-map";

/** 首页组件，使用全屏容器渲染世界地图 */
export default function Home() {
  return (
    <main className="h-dvh w-screen overflow-hidden">
      <WorldMap />
    </main>
  );
}
