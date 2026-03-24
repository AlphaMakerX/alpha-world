## Context

`WorldMap`（`src/client/features/world-map/components/world-map.tsx`）当前约 700+ 行：并行挂载 plot / person / factory / shop / purchasing station / inventory 等 tRPC 查询与多个 `useMutation`，并在同一组件内维护 Phaser `Game` 引用、玩家位置待同步 ref、体力状态、以及多个 `useEffect`（认证标志、体力回写、位置基准、定时同步、Phaser 启动、场景 `WORLD_MAP_SYNC_EVENT`）。业务 handler（购买地块、建造、工厂/商店/收购站操作）与基础设施逻辑交织，阅读路径长。

## Goals / Non-Goals

**Goals:**

- 将 **UI 组合根**（Header、地图容器、各 Modal）与 **领域数据/变更**、**Phaser 生命周期**、**玩家与服务器同步** 分层，使单文件行数显著下降、依赖方向单向（壳 → hooks → tRPC）。
- 收敛 `useEffect`：每个 effect 单一职责或文档化命名，避免「一个巨型 effect」难以推理。
- 保持现有用户可见行为、网络请求时机（`enabled` 条件）、以及 `PlotDetailModal` 等 props 契约等价；重构后应通过现有手动回归或关键路径自测验证。

**Non-Goals:**

- 不改变 tRPC 路由、服务端逻辑或数据库。
- 不重做 `world-map-scene` 内游戏玩法或视觉（除非为配合类型/回调整理所必需的最小调整）。
- 不引入新的全局状态库；优先 React hooks + 并列模块。

## Decisions

1. **按领域拆自定义 hooks**  
   - **Rationale**：plot 列表与 `selectedPlot` 派生状态是工厂/商店/收购站查询的枢纽，可先抽 `useWorldMapPlotContext`（或拆为 `usePlotQueries` + `useSelectedPlotDerived`）；工厂/商店/收购站各自 `useFactoryForPlot`、`useShopForPlot`、`usePurchasingStationForPlot`（内部根据 `selectedPlot` 与 capabilities 决定 `enabled`）。  
   - **Alternatives**：单一大 hook `useWorldMapData`——仍可能臃肿；按文件物理拆分多个 hook 文件更清晰。

2. **玩家同步与 Phaser 分两条线**  
   - `usePlayerPositionSync`（或等价命名）：封装 `pendingPlayerPositionRef`、`lastSyncedPlayerPositionRef`、`POSITION_SYNC_INTERVAL_MS`、定时 `updatePositionMutation`、以及与 `isGameReady` + `gameRef` 的 emit。  
   - `usePhaserWorldMap`（或等价）：封装动态 import、`createWorldMapScene`、销毁与 `hasInitializedSceneRef`、`isInitialWorldDataLoading` 门闩。  
   - **Rationale**：同步策略与渲染引擎生命周期正交，分离后 effect 依赖数组更易审查。

3. **Mutations 与 message 反馈**  
   - 领域 handlers 可留在 hook 内返回 `handlers` 对象，或集中在 `useWorldMapActions` 中注入 `messageApi` / `trpcUtils`；**Rationale**：减少 `WorldMap` 内联 async 函数数量，便于按领域跳转阅读。

4. **常量与纯函数外置**  
   - `MAP_MAX_X/Y`、`getDistance`、`isInitialQueryLoading` 等移到 `world-map-constants.ts` / `world-map-utils.ts`（或 colocated），避免壳文件噪音。

## Risks / Trade-offs

- **[Risk] 重构引入同步/regression（位置、体力、地块刷新）** → 对照现有依赖数组与 `enabled` 条件逐项迁移；合并 PR 前完整跑一遍登录、移动、购买、建造、工厂/商店/收购站操作。  
- **[Risk] hook 过度拆分导致 prop drilling** → 仅在 `WorldMap` 下一层组合 hooks，必要时用小型 context 仅限本 feature（默认不采用）。  
- **[Trade-off] 文件数量增加** → 用目录索引（如 `hooks/index.ts` 或 README 片段）可选；以可读性优先。

## Migration Plan

- 分阶段提交：先抽常量/工具函数 → 再抽 Phaser → 再抽同步 → 最后抽领域查询/handlers，每步保持可编译可运行。  
- 无需数据迁移；回滚即为恢复单文件实现（git revert）。

## Open Questions

- `PlotDetailModal` 的 props 是否在后续迭代中改为「容器 + 展示」拆分；本次可保持 props 形状不变，仅改变数据来源。
