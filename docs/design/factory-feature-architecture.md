# Factory Feature 架构说明

## 目标

`factory` feature 负责工厂生产相关能力，包含：

- 配方列表查询
- 订单查询（进行中 + 历史）
- 发起生产（扣材料/扣钱/创建生产任务）

当前实现采用统一分层：`router -> composition -> application -> domain -> infrastructure`。

## 分层职责

### Router 层

文件：`src/server/lib/trpc/routers/factory.ts`

- 定义 tRPC API：`recipes`、`orders`、`startProduction`
- 负责鉴权（`publicProcedure` / `protectedProcedure`）
- 通过 `unwrapUseCaseResult` 把 use case 失败结果映射为 TRPCError

### Composition 层

文件：`src/server/features/factory/composition/index.ts`

- 输入校验：`listFactoryOrdersSchema`、`startFactoryProductionSchema`
- 依赖装配：注入 repository/service/transaction
- 把 `unknown input` 转换为 `application` 层的 `command`

### Application 层

目录：`src/server/features/factory/application`

- `list-factory-recipes-use-case.ts`
  - 返回配方目录
- `list-factory-orders-use-case.ts`
  - 校验建筑与地块归属
  - 自动结算已完成任务（入库 + 状态更新）
  - 返回 `focusOrder` + `historyOrders`
- `start-factory-production-use-case.ts`
  - 校验建筑、配方、所有权、库存、余额
  - 事务内执行：扣材料/扣钱/记账/创建生产任务

说明：Application 只依赖接口（deps），不直接依赖基础设施实现。

### Domain 层

目录：`src/server/features/factory/domain`

- 实体：`FactoryProductionJob`
- 仓储接口：`FactoryProductionJobRepository`
- 领域行为：
  - `FactoryProductionJob.start(...)`
  - `job.canCollectAt(now)`
  - `job.collect(now)`

### Infrastructure 层

目录：`src/server/features/factory/infrastructure`

- Drizzle 仓储实现：`factory-production-job-repository.ts`
- schema：`schema.ts`
- 对外导出：`factoryProductionJobRepository`

## 关键依赖关系

- `factory` 依赖 `building` + `plot` 做建筑合法性和地块所有权校验
- `factory` 依赖 `inventory` 做材料消耗与产物入库
- `factory` 依赖 `person`（`userRepository`、`transactionLedgerRepository`、`systemAccountService`）完成资金流转
- `factory` 通过 `transact` 保证生产开始流程的原子性

## 一次请求的执行路径（startProduction）

1. 客户端调用 `factory.startProduction`
2. `router` 注入 `ctx.userId`
3. `composition` 做 zod 校验 + 组装 deps
4. `application` 校验业务规则并在事务中落库
5. 返回 `UseCaseResult`
6. `router` 使用 `unwrapUseCaseResult` 输出成功数据或抛出 TRPCError

## 设计收益

- 业务规则集中在 `application/domain`，更易测试
- `composition` 统一输入校验和依赖注入，便于横向一致性
- `infrastructure` 可替换，降低与 ORM/数据库的耦合
- 事务边界清晰，减少“部分成功”问题
