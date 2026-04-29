# Alpha World — 系统架构

> 基于地图的模拟经营 Web 游戏。玩家在 2D 地图上移动、购买地块、建造建筑、生产物品并交易。系统内置央行角色 Adam 负责资金发放与收取。

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript (严格模式) |
| 数据库 | PostgreSQL + Drizzle ORM |
| API | tRPC v11 |
| 认证 | NextAuth.js (JWT + Credentials) |
| UI | Ant Design 6 + Tailwind CSS 4 |
| 游戏引擎 | Phaser 3 |
| 数据请求 | TanStack React Query |
| 校验 | Zod 4 |

## 目录结构

```
src/
├── app/                    # Next.js App Router（路由入口 + tRPC 端点）
├── client/                 # 前端层
│   ├── components/         # 通用 UI 组件
│   ├── features/           # 按业务划分（auth, world-map, plot, building, shop, ...)
│   └── lib/                # trpc client, providers
└── server/                 # 后端层（DDD 分层）
    ├── lib/                # db, trpc, auth 基础设施
    └── features/           # 按限界上下文划分
        ├── auth/           # 注册与认证
        ├── person/         # 用户信息与资金
        ├── plot/           # 地块管理
        ├── building/       # 建筑（含工厂子类型）
        ├── factory/        # 工厂生产、配方解锁、升级
        ├── recipe/         # 配方目录（静态数据）
        ├── api-access-token/ # API 令牌（Phase 1）
        └── shared-kernel/  # DomainError、Adam 常量
```

## 后端分层（每个 feature 内部）

```
feature/
├── application/          # Use Case（编排领域逻辑）
├── domain/               # 实体、值对象、仓储接口
├── infrastructure/       # Drizzle 表定义 + 仓储实现
└── composition/          # 依赖装配 + 导出
```

## 限界上下文

| 上下文 | 职责 |
|--------|------|
| auth | 注册、密码哈希、JWT |
| person | User 实体、资金、流水 |
| plot | Plot 聚合根、坐标、所有权、购买 |
| building | Building 聚合根、类型(residential/factory/shop/purchasing_station)、subtype、level |
| factory | 生产任务、配方解锁、工厂升级 |
| shared-kernel | DomainError、Adam 常量 |

## 经济系统

```
        注册赠金(10000)
Adam ──────────────→ 新玩家
  ↑                    │
  │ 买地/建造/生产/解锁  │
  └────────────────────┘

玩家 A → 商店上架 → 玩家 B 购买 → 资金转移
玩家 A → 收购站挂单 → 玩家 B 出货 → 资金转移
```

生产链：原材料采购(消耗资金) → 工厂生产(消耗原料+时间) → 产出入背包 → 商店/收购站出售

## 前端架构

单页面（`/`），全屏 Phaser 地图 + React 弹窗层（PlotDetailModal, InventoryModal 等）。

数据流：React 组件 → tRPC Client → HTTP → tRPC Server → Use Case → Domain → Repository → DB → TanStack Query 缓存返回。
