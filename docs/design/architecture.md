# Alpha World — 系统架构设计文档

> 版本: 1.0 | 最后更新: 2026-03-17

## 1. 项目概述

Alpha World 是一款**基于地图的模拟经营 Web 游戏**。玩家可以在 2D 地图上移动、购买地块、建造建筑（工厂、商店、收购站等）、生产物品并进行交易。系统内置「央行」角色 Adam，作为经济系统的锚点，负责资金发放与费用收取。

## 2. 技术栈总览

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | Next.js 16 (App Router) | 全栈框架，SSR + API 一体化 |
| 语言 | TypeScript (严格模式) | 全栈统一语言 |
| 数据库 | PostgreSQL | 关系型数据库 |
| ORM | Drizzle ORM | 类型安全的轻量 ORM |
| API | tRPC v11 | 端到端类型安全 RPC |
| 认证 | NextAuth.js (JWT + Credentials) | 用户认证 |
| UI 框架 | Ant Design 6 + Tailwind CSS 4 | 组件库 + 原子化样式 |
| 游戏引擎 | Phaser 3 | 2D 地图渲染与交互 |
| 数据请求 | TanStack React Query | 服务端状态管理 |
| 校验 | Zod 4 | 运行时类型校验 |

## 3. 系统分层架构

项目采用 **DDD（领域驱动设计）** 分层架构，前后端代码同仓管理：

```
alpha-world/
├── src/
│   ├── app/                    # Next.js App Router（路由入口）
│   │   ├── api/trpc/           # tRPC HTTP 端点
│   │   ├── layout.tsx          # 全局布局
│   │   └── page.tsx            # 首页（WorldMap）
│   │
│   ├── client/                 # 前端层
│   │   ├── components/         # 通用 UI 组件
│   │   ├── features/           # 按业务领域划分的功能模块
│   │   │   ├── auth/           # 登录/注册
│   │   │   ├── world-map/      # 地图主场景
│   │   │   ├── plot/           # 地块详情
│   │   │   ├── building/       # 建筑（工厂）
│   │   │   ├── shop/           # 商店
│   │   │   ├── purchasing-station/ # 收购站
│   │   │   ├── person/         # 个人资料
│   │   │   ├── inventory/      # 背包
│   │   │   └── game-info/      # 游戏说明
│   │   └── lib/                # 前端基础设施（trpc client, providers）
│   │
│   └── server/                 # 后端层
│       ├── lib/                # 后端基础设施
│       │   ├── db/             # 数据库连接 & Schema 汇总
│       │   ├── trpc/           # tRPC 初始化 & 路由合并
│       │   └── auth/           # NextAuth 配置
│       └── features/           # 按限界上下文划分
│           ├── auth/           # 认证上下文
│           ├── person/         # 用户上下文
│           ├── plot/           # 地块上下文
│           ├── building/       # 建筑上下文
│           └── shared-kernel/  # 共享内核
│
├── scripts/                    # 运维脚本
├── drizzle/                    # 数据库迁移文件
├── public/assets/              # 静态资源（Phaser 纹理）
├── design-system/              # 设计系统规范
└── docs/                       # 项目文档
```

## 4. 后端架构（DDD 分层）

每个限界上下文（Bounded Context）内部遵循三层架构：

```
server/features/<context>/
├── application/          # 应用层 — Use Case
│   └── *.use-case.ts     # 编排领域逻辑，处理事务
├── domain/               # 领域层 — 核心业务
│   ├── entities/         # 聚合根 & 实体
│   ├── value-objects/    # 值对象
│   └── repositories/     # 仓储接口（抽象）
└── infrastructure/       # 基础设施层
    ├── schema.ts         # Drizzle 表定义
    └── *-repository.ts   # 仓储实现（Drizzle）
```

### 4.1 限界上下文

| 上下文 | 职责 | 核心概念 |
|--------|------|---------|
| **auth** | 用户注册与认证 | 注册、密码哈希、JWT |
| **person** | 用户信息与资金 | User 实体、Money、资金流水 |
| **plot** | 地块管理 | Plot 聚合根、坐标、所有权 |
| **building** | 建筑与生产交易 | Building 聚合根、工厂配方、库存、商店、收购站 |
| **shared-kernel** | 跨上下文共享 | DomainError、Adam 常量 |

### 4.2 聚合与实体

**User 实体**
- 属性：`id`, `username`, `money`
- 值对象：`Username`（3–32 字符约束）

**Plot 聚合根**
- 属性：`id`, `coordinate`, `ownerUserId`, `status`, `price`
- 状态：`available` → `locked` → `owned`
- 行为：`purchaseBy()`, `lock()`, `unlock()`
- 值对象：`PlotCoordinate`（整数坐标）

**Building 聚合根**
- 属性：`id`, `plotId`, `type`, `level`, `position`
- 类型：`residential` | `factory` | `shop` | `purchasing_station`
- 行为：`upgrade()`, `transferOwner()`

### 4.3 Use Case 模式

所有用例采用统一的函数签名，返回 Result 类型：

```typescript
type UseCaseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };
```

典型用例：`executePurchasePlotUseCase`, `executeBuildBuildingUseCase`, `executeStartProductionUseCase` 等。

## 5. API 设计（tRPC）

所有 API 通过 tRPC 暴露，入口为 `/api/trpc`。

### 5.1 路由总览

| 模块 | 端点 | 类型 | 认证 | 说明 |
|------|------|------|------|------|
| auth | `register` | mutation | 公开 | 用户注册 |
| person | `me` | query | 登录 | 当前用户信息 |
| person | `wealthLeaderboard` | query | 登录 | 财富排行榜 |
| person | `adamProfile` | query | 登录 | Adam 央行信息 |
| plot | `list` | query | 公开 | 地块列表 |
| plot | `purchase` | mutation | 登录 | 购买地块 |
| building | `build` | mutation | 登录 | 建造建筑 |
| building | `myBuildings` | query | 登录 | 我的建筑 |
| building | `myInventory` | query | 登录 | 我的背包 |
| building | `factoryRecipes` | query | 登录 | 工厂配方列表 |
| building | `startProduction` | mutation | 登录 | 开始生产 |
| building | `collectProduction` | mutation | 登录 | 收取产物 |
| building | `createShopListing` | mutation | 登录 | 商店上架 |
| building | `shopListings` | query | 登录 | 商店商品列表 |
| building | `purchaseShopListing` | mutation | 登录 | 购买商品 |
| building | `createBuyOrder` | mutation | 登录 | 创建收购订单 |
| building | `buyOrders` | query | 登录 | 收购订单列表 |
| building | `fulfillBuyOrder` | mutation | 登录 | 履行收购订单 |

### 5.2 认证流程

```
客户端 → NextAuth (Credentials Provider) → 验证用户名/密码 → 签发 JWT
       → 后续请求携带 JWT → tRPC middleware 解析 session → protectedProcedure
```

## 6. 数据库设计

### 6.1 表结构

**users 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| username | VARCHAR | 用户名（唯一） |
| password_hash | VARCHAR | 密码哈希 |
| money | NUMERIC | 余额 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**money_transactions 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| from_user_id | UUID (FK) | 付款方 |
| to_user_id | UUID (FK) | 收款方 |
| amount | NUMERIC | 金额 |
| type | VARCHAR | 类型 |
| reference_id | UUID | 关联业务 ID |
| description | TEXT | 描述 |

**plots 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| x | INTEGER | X 坐标 |
| y | INTEGER | Y 坐标 |
| owner_user_id | UUID (FK) | 所有者 |
| status | ENUM | available / owned / locked |
| price | NUMERIC | 价格 |

**plot_buildings 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| plot_id | UUID (FK) | 所在地块 |
| type | ENUM | residential / factory / shop / purchasing_station |
| status | VARCHAR | 状态 |

**inventories 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| owner_user_id | UUID (PK) | 所有者 |
| item_key | VARCHAR (PK) | 物品标识 |
| quantity | INTEGER | 数量 |

**factory_production_jobs 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| building_id | UUID (FK) | 工厂建筑 |
| owner_user_id | UUID (FK) | 所有者 |
| recipe_id | VARCHAR | 配方 ID |
| inputs / outputs | JSONB | 输入/输出物品 |
| status | VARCHAR | 状态 |
| started_at / finish_at | TIMESTAMP | 生产时间 |

**shop_listings 表** — 商店挂单

**buy_orders 表** — 收购站订单

## 7. 前端架构

### 7.1 页面结构

整个应用为单页面（`/`），以全屏 Phaser 地图为核心，叠加 React UI 层：

```
┌─────────────────────────────────────────────┐
│  WorldMapHeader（顶部栏）                     │
│  [余额] [背包] [游戏信息] [登录/登出]           │
├─────────────────────────────────────────────┤
│                                             │
│            Phaser 2D 地图场景                 │
│     （地块网格 / 道路 / 建筑 / 玩家角色）       │
│                                             │
│    ┌─────────────────────┐                  │
│    │  PlotDetailModal    │  ← 弹窗层         │
│    │  PersonDetailModal  │                  │
│    │  InventoryModal     │                  │
│    │  AuthPanel          │                  │
│    └─────────────────────┘                  │
└─────────────────────────────────────────────┘
```

### 7.2 Phaser 游戏场景

- 地块 ID 格式：`P{row}-{col}`（如 `P1-01`）
- 支持键盘方向键移动 + Space 交互
- 相机跟随玩家，带 lerp 平滑滚动
- 地块根据状态（可购/已购/已建）显示不同颜色

### 7.3 前端数据流

```
React 组件 → tRPC Client → HTTP → tRPC Server → Use Case → Domain → Repository → DB
     ↑                                                                              |
     └─── TanStack Query（缓存 + 自动刷新）←─────────────── 返回结果 ────────────────┘
```

## 8. 经济系统

### 8.1 系统玩家 Adam

- 固定 ID：`00000000-0000-0000-0000-000000000001`
- 角色：「央行」，持有初始资金池
- 功能：发放注册赠金、收取买地费、收取建造费、收取生产费
- 约束：不可登录，不可被注册同名

### 8.2 资金流转

```
        注册赠金
Adam ──────────→ 新玩家
  ↑                │
  │  买地/建造/生产  │
  └────────────────┘

玩家 A ──→ 商店上架 ──→ 玩家 B 购买 ──→ 资金转移
玩家 A ──→ 收购站挂单 ──→ 玩家 B 出货 ──→ 资金转移
```

### 8.3 工厂生产链

```
原材料采购（消耗资金）
    ↓
工厂生产（消耗原料 + 时间）
    ↓
产出物品 → 存入背包
    ↓
商店上架 / 收购站出售 → 获得资金
```

配方示例：铁矿石 → 铁锭，木材 → 木板，棉花 → 布料 等。

## 9. 部署与运维

### 9.1 初始化流程

1. 配置 `.env.local`（数据库连接、Auth 密钥）
2. `npm run drizzle:push` — 推送数据库 Schema
3. `npm run init:system` — 创建 Adam 和 Bot 用户
4. `npm run seed:plots:p1` — 生成种子地块
5. `npm run dev` — 启动开发服务器（端口 8080）

### 9.2 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | JWT 签名密钥 |
| `NEXTAUTH_URL` | 认证回调地址 |
| `NEXT_PUBLIC_APP_URL` | 前端公开地址 |

## 10. 设计系统

- **主色调**：`#7C3AED`（紫色）
- **CTA 色**：`#F97316`（橙色）
- **背景色**：`#FAF5FF`
- **字体**：Inter
- **设计风格**：Exaggerated Minimalism
- **组件规范**：参见 `design-system/alpha-world/MASTER.md`

## 11. 架构图

详见 [architecture-diagram.drawio](../architecture-diagram.drawio)
