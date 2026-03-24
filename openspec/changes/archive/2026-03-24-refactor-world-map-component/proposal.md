## Why

`WorldMap` 单文件集中了 Phaser 场景生命周期、玩家位置/体力同步、十余个 tRPC 查询与变更、以及地块/建造/工厂/商店/收购站等业务处理器，阅读和修改成本高，也容易在迭代时引入耦合与回归。需要在不改变对外行为的前提下拆分职责、收敛 `useEffect`，让地图壳层与各领域交互边界清晰。

## What Changes

- 将 `world-map.tsx` 中的**数据获取与变更**按领域拆到自定义 hooks 或并列模块（plot、build、factory、shop、purchasing station、auth/session、inventory），`WorldMap` 主要负责组合与传参。
- 将**玩家状态同步**（refs、`WORLD_MAP_SYNC_EVENT`、定时 `updatePosition`）抽到独立 hook（或小型模块），`useEffect` 按「认证 / 体力 / 位置基准 / 定时同步 / Phaser 启动 / 场景事件同步」拆分或合并为少量命名清晰的单元。
- 将 **Phaser bootstrap**（动态 import、Game 配置、`createWorldMapScene` 回调）与清理逻辑隔离，便于单测意图与后续替换实现。
- 保留现有 UI 结构（Header、`PlotDetailModal` 等）与用户可见行为；属内部重构，无 API 契约变更。

## Capabilities

### New Capabilities

- `world-map-composition`：定义 World Map 客户端组合方式——壳组件职责、领域数据/变更的挂载点、Phaser 与服务器同步的边界，使实现可维护且不改变玩家可见行为。

### Modified Capabilities

- （无）当前仓库 `openspec/specs/` 下尚无既有能力规格；本变更不引入新的对外产品需求，仅约束客户端结构与非功能可维护性。

## Impact

- **代码**：`src/client/features/world-map/components/world-map.tsx` 及同目录或 `hooks/`、`lib/` 下新增/移动的模块；可能轻触 `world-map-scene.ts` 仅当回调签名需配合整理（优先保持不动）。
- **依赖**：无新增运行时依赖预期。
- **系统**：无服务端、tRPC 路由或数据库变更。
