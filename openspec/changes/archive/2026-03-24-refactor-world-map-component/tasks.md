## 1. 提取共享常量与工具

- [x] 1.1 将 `MAP_MAX_X`、`MAP_MAX_Y`、`POSITION_SYNC_INTERVAL_MS`、`POSITION_MIN_DISTANCE_TO_SYNC`、`DEFAULT_PLAYER_STAMINA` 等抽到 `world-map` feature 下独立文件（如 `world-map-constants.ts`）
- [x] 1.2 将 `getDistance`、`isInitialQueryLoading` 抽到 `world-map-utils.ts`（或同级），并从 `world-map.tsx` 引用

## 2. 拆分 Phaser 生命周期

- [x] 2.1 新增 `usePhaserWorldMap`（或等价 hook）：接收 `containerRef`、`isInitialWorldDataLoading`、`worldMapPlots`、`currentUserId`、`playerPosition`、`serverPlayerStamina` 及场景回调依赖，封装动态 import、`createWorldMapScene`、`gameRef`/`hasInitializedSceneRef`/`isGameReady` 与卸载销毁
- [x] 2.2 在 `world-map.tsx` 中替换原有 Phaser `useEffect`，确认加载门闩与 cleanup 与现状一致

## 3. 拆分玩家同步与场景事件

- [x] 3.1 新增 `usePlayerMapSync`（或拆分多个小 hook）：包含 `isAuthenticatedRef`、体力与服务端对齐的 effect、位置基准 ref 的 effect、定时 `updatePositionMutation` 的 interval，以及在同步成功后对 `WORLD_MAP_SYNC_EVENT` 的 emit（与 `isGameReady`/`gameRef` 协作）
- [x] 3.2 保留独立 effect：在 `isGameReady` 且 plots/用户/位置/体力变化时向场景 emit（可并入上一步 hook 的清晰子函数，但避免单一巨型 effect）
- [x] 3.3 核对依赖数组与 `enabled` 条件，避免多余请求或丢失同步

## 4. 按领域拆分数据与变更

- [x] 4.1 抽取 plot 相关：`plot.list`、`selectedPlotId`/`plotById`/`worldMapPlots`/`worldMapPlotsKey`、购买 mutation 与 `handlePurchase`（可合并为 `useWorldMapPlots`）
- [x] 4.2 抽取建造：`building.build` 与 `handleBuild`
- [x] 4.3 抽取工厂：`factory.recipes`/`factory.orders`、`startProduction` 与 `handleStartProduction`（依赖 `selectedPlot` 与 `getBuildingCapabilities`）
- [x] 4.4 抽取商店：`shop.listings`/`transactionHistory` 及相关 listing mutations/handlers
- [x] 4.5 抽取收购站：`purchasingStation` 查询与 mutations/handlers
- [x] 4.6 抽取 inventory / person：`inventory.mine`、`person.me`、登出前 `updatePosition` 等与 Header/Modal 共用的数据，避免重复 `useQuery`

## 5. 收敛 WorldMap 组件

- [x] 5.1 `WorldMap` 仅保留：组合上述 hooks、本地 UI 状态（各 Modal open）、`WorldMapHeader` 与 `PlotDetailModal` 的 props 拼装、`handleLogout` 编排（或移入 auth hook）
- [x] 5.2 运行 TypeScript 编译与 ESLint，修复因移动代码产生的类型或未使用导入
- [ ] 5.3 手动回归：未登录/登录、地图加载、选地块、购买/建造、工厂/商店/收购站、背包与登出
