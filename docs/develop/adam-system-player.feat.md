# 系统玩家 Adam（亚当）

## 概述

引入系统玩家 **Adam**，作为游戏经济系统的"央行"角色。Adam 在系统初始化时创建，拥有全部货币总量。所有玩家的初始资金从 Adam 发放，所有系统收费（买地、建造、生产）均回流至 Adam，每一笔资金流转都记录在交易账本中。

## 资金流向

```
         注册赠金 (10,000)
  Adam ──────────────────────→ 玩家

         购买地块 (地块价格)
  玩家 ──────────────────────→ Adam

         建造建筑 (建造费用)
  玩家 ──────────────────────→ Adam

         工厂生产 (配方 money 消耗)
  玩家 ──────────────────────→ Adam

         商店购买 (P2P)
  买家 ──────────────────────→ 卖家
```

## Adam 属性

| 属性 | 值 |
|------|-----|
| ID | `00000000-0000-0000-0000-000000000001` |
| 用户名 | `adam` |
| 初始资金 | 1,000,000,000（10 亿） |
| 可登录 | 否（login 拦截） |
| 可注册同名 | 否（register 拦截） |

## 交易账本 `money_transactions`

每一笔资金流转都写入该表，字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | bigint PK | 自增主键 |
| `from_user_id` | uuid FK | 付款方 |
| `to_user_id` | uuid FK | 收款方 |
| `amount` | numeric(12,2) | 金额（> 0） |
| `type` | varchar(30) | 交易类型 |
| `reference_id` | varchar(100) | 关联业务 ID（地块 / 建筑 / 生产任务 / 商品） |
| `description` | varchar(255) | 交易描述 |
| `created_at` | timestamptz | 创建时间 |

### 交易类型 `type` 枚举

| 值 | 含义 | 方向 |
|----|------|------|
| `registration_grant` | 注册赠金 | Adam → 玩家 |
| `plot_purchase` | 购买地块 | 玩家 → Adam |
| `building_construction` | 建造建筑 | 玩家 → Adam |
| `factory_production` | 工厂生产 | 玩家 → Adam |
| `shop_purchase` | 商店购买 | 买家 → 卖家 |

## 建筑建造费用

| 建筑类型 | 费用 |
|----------|------|
| residential | 500 |
| factory | 800 |
| shop | 600 |

## 涉及文件

### 新增

- `src/server/features/shared-kernel/domain/adam.ts` — Adam 常量
- `src/server/features/person/domain/repositories/transaction-ledger-repository.ts` — 账本仓储接口
- `src/server/features/person/infrastructure/transaction-ledger-repository.ts` — Drizzle 实现
- `src/server/features/building/application/building-cost-catalog.ts` — 建造费用目录
- `scripts/initialize-system.ts` — Adam 初始化脚本

### 修改

- `src/server/features/person/infrastructure/schema.ts` — 新增 `moneyTransactions` 表
- `src/server/features/person/infrastructure/index.ts` — 导出 `transactionLedgerRepository`
- `src/server/features/auth/application/register-user-use-case.ts` — 从 Adam 扣款发放赠金
- `src/server/features/auth/application/login-user-use-case.ts` — 禁止 Adam 登录
- `src/server/features/plot/application/purchase-plot-use-case.ts` — 买地费用转给 Adam
- `src/server/features/building/application/build-building-use-case.ts` — 建造费用转给 Adam
- `src/server/features/building/application/start-factory-production-use-case.ts` — 生产费用转给 Adam
- `src/server/features/building/application/purchase-shop-listing-use-case.ts` — 记录 P2P 交易

## 初始化

```bash
npm run drizzle:push    # 推送 schema（含 money_transactions 表）
npm run init:system     # 创建 Adam 系统玩家
```
