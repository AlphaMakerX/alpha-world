# Phase 5 架构设计：体力系统

基于 [1-design.md](./1-design.md) 的业务规则，描述模块划分、职责边界、数据流。

## 一、涉及模块总览

| 模块 | 变更类型 | 说明 |
|------|---------|------|
| shared/gameplay | 修改 | 体力常量调整（MAX=1000, 恢复=10/h, 消耗系数=0.1） |
| person | 修改 | User 实体新增 consumeStamina / recoverStaminaByAmount 方法 |
| factory | 修改 | start-factory-production 加入体力校验与扣除 |
| **residential**（新建） | 新建 | 住宅休息功能的完整模块 |
| finance | 修改 | 新增交易类型 residential_rest / residential_rest_service |

## 二、常量变更

`src/shared/gameplay/player-stamina.ts`：

| 常量 | 现值 | 新值 |
|------|------|------|
| PLAYER_MAX_STAMINA | 100 | 1000 |
| PLAYER_STAMINA_RECOVERY_PER_SECOND | 0.18 | ≈0.00278（10/3600） |

新增常量：`STAMINA_COST_PER_SECOND = 0.1`

## 三、User 实体变更

在 `src/server/features/person/domain/entities/user.ts` 新增两个方法：

- **consumeStamina(amount)**：校验体力充足 → 扣除 → 更新 staminaUpdatedAt
- **recoverStaminaByAmount(amount)**：直接加体力 → 截断到 staminaMax → 更新 staminaUpdatedAt

现有 `recoverStamina()` 不变，DB schema 不变。

注册时初始体力随 MAX 变为 1000（修改 `User.register()` 中引用的常量）。

## 四、工厂生产体力扣除

改造 `start-factory-production-use-case.ts`，在「校验配方已解锁」之后、「扣材料扣钱」之前插入：

1. 获取 ownerUser，调用 `recoverStamina(now)` 结算自然恢复
2. 计算 `staminaCost = scaledDuration × 0.1`（scaledDuration = recipe.durationSeconds × quantity）
3. 调用 `user.consumeStamina(staminaCost)`，不足则返回错误
4. 将 user 保存纳入已有事务

不新增依赖——use case 已有 userRepository。

## 五、新建 residential 模块

复用 factory 模块的分层结构：

```
src/server/features/residential/
├── domain/
│   ├── entities/
│   │   └── rest-job.ts              # 休息任务实体
│   ├── repositories/
│   │   └── rest-job-repository.ts   # 仓库接口
│   ├── rest-catalog.ts              # 休息类型静态配置
│   └── index.ts
├── application/
│   ├── start-rest-use-case.ts
│   ├── collect-rest-use-case.ts
│   ├── list-rest-jobs-use-case.ts
│   ├── set-rest-price-use-case.ts
│   └── index.ts
├── infrastructure/
│   ├── schema.ts                    # residential_rest_jobs 表
│   ├── rest-job-repository.ts
│   └── index.ts
├── composition/
│   └── index.ts
└── index.ts
```

### 5.1 RestJob 实体

仿照 `FactoryProductionJob`，核心属性：

| 属性 | 说明 |
|------|------|
| id | 主键 |
| buildingId | 所属住宅建筑 |
| ownerUserId | 住宅所有者（收款方） |
| resterUserId | 休息发起人（付款方） |
| restType | 休息类型（当前只有 "full_rest"） |
| staminaGain | 恢复量（1000） |
| cost | 实际支付金额 |
| status | in_progress / completed / collected |
| startedAt / finishAt / collectedAt | 时间戳 |

关键方法：
- `RestJob.start(...)` — 静态工厂方法，创建新任务
- `canCollect(now)` — 判断是否可收取
- `collect(now)` — 标记已收取

与 FactoryProductionJob 的差异：多一个 `resterUserId`（休息人 ≠ 住宅主人时）。

### 5.2 rest-catalog 静态配置

单一档位配置：

| 字段 | 值 |
|------|-----|
| id | full_rest |
| durationSeconds | 300 |
| staminaGain | 1000 |
| defaultCost | 500（自己住宅的价格） |

### 5.3 住宅定价

住宅主人需设定对外休息服务价格。两种方案：

**方案 A：Building 实体加字段**
- `plot_buildings` 表新增 `rest_price` 列（nullable numeric）
- 为 null 时表示不开放对外休息
- 优点：简单，查询快
- 缺点：侵入 building 模块

**方案 B：独立配置表**
- `residential_rest_config(building_id PK, price numeric, updated_at)` 
- 优点：residential 模块完全自治
- 缺点：多一张表

**建议方案 A**——一个字段足以表达，不需要额外表的复杂度。

### 5.4 用例设计

#### start-rest-use-case

前置校验：
1. 获取建筑，确认为住宅类型
2. 获取地块，确认地块归属（谁的住宅）
3. 检查该住宅无进行中的休息任务
4. 判断是自己的还是别人的住宅：
   - **自己的**：cost = 500，收款方 = Adam（系统）
   - **别人的**：cost = 住宅主人设定的 restPrice，需 restPrice 不为 null；收款方 = 住宅主人（90%）+ Adam（10%）
5. 校验金币充足

事务执行：
1. 创建 RestJob（status=in_progress, finishAt=now+300s）
2. 转账（通过 FinanceService）

依赖：buildingRepository, plotRepository, restJobRepository, userRepository, financeService, systemAccountService, transact

#### collect-rest-use-case

1. 获取 RestJob，校验 resterUserId 匹配
2. 校验 canCollect(now)
3. 获取 resterUser，调用 `recoverStamina(now)` 结算自然恢复
4. 调用 `user.recoverStaminaByAmount(job.staminaGain)` 恢复体力
5. 事务：job.collect(now) + 保存 job + 保存 user

#### list-rest-jobs-use-case

查询某住宅的休息任务列表（当前进行中 + 历史），与 list-factory-orders 同形。

#### set-rest-price-use-case

住宅主人设定对外休息价格。设为 null 表示关闭对外服务。

## 六、数据库变更

### 新建表：residential_rest_jobs

| 列 | 类型 | 说明 |
|----|------|------|
| id | bigserial PK | |
| building_id | bigint FK → plot_buildings | CASCADE |
| owner_user_id | uuid FK → users | 住宅主人 |
| rester_user_id | uuid FK → users | 休息人 |
| rest_type | varchar(20) | 'full_rest' |
| stamina_gain | numeric(10,2) | 恢复量 |
| cost | numeric(10,2) | 实际支付 |
| status | varchar(20) | in_progress / collected |
| started_at | timestamptz | |
| finish_at | timestamptz | |
| collected_at | timestamptz | nullable |

索引：building_id, rester_user_id, status

### 修改表：plot_buildings

新增列 `rest_price numeric(10,2) nullable`（方案 A）

## 七、tRPC 路由

新建 `src/server/lib/trpc/routers/residential.ts`，注册到 `_app.ts`。

| Procedure | 类型 | 说明 |
|-----------|------|------|
| residential.startRest | mutation | { buildingId } |
| residential.collectRest | mutation | { jobId } |
| residential.restJobs | query | { buildingId } |
| residential.setRestPrice | mutation | { buildingId, price: number \| null } |

## 八、finance 变更

MoneyTransactionType 新增：
- `residential_rest` — 在自己住宅休息（付给 Adam）
- `residential_rest_service` — 在别人住宅休息（拆分两笔：90% 付主人 + 10% 付 Adam）

## 九、前端（概要）

- 顶部栏体力条：读取 `person.me` 返回的 stamina 数据，前端插值动画
- 生产面板：显示 `durationSeconds × quantity × 0.1` 体力消耗预览
- 住宅详情面板：休息按钮 + 收取按钮 + 定价设置（主人视角）
