# Phase 5 任务清单

TDD 模式：RED → GREEN → typecheck

## 任务 1：体力常量与 User 实体（TDD）

### 1.1 先写测试

- [x] 按 test-user-stamina.md 规格，创建 `person/domain/__tests__/user-stamina.test.ts`
- [x] 运行测试 → 确认全部失败（RED）

### 1.2 再写实现

- [x] 修改 `src/shared/gameplay/player-stamina.ts`：MAX=1000, RECOVERY=10/3600, 新增 STAMINA_COST_PER_SECOND=0.1
- [x] 在 User 实体新增 `consumeStamina(amount)` 方法
- [x] 在 User 实体新增 `recoverStaminaByAmount(amount)` 方法
- [x] 运行测试 → 全部 GREEN

### 1.3 收尾

- [x] 运行 typecheck → 零错误（3 个预存错误，非本次引入）

## 任务 2：工厂生产体力扣除（TDD）

### 2.1 先写测试

- [x] 按 test-factory-stamina.md 规格，在 `factory/application/__tests__/start-factory-production-use-case.test.ts` 追加体力相关用例
- [x] 运行测试 → 新增用例失败（RED）

### 2.2 再写实现

- [x] 改造 `start-factory-production-use-case.ts`：校验配方解锁后，增加 recoverStamina → 计算消耗 → consumeStamina → 保存 user
- [x] 运行测试 → 全部 GREEN（203/203）

### 2.3 收尾

- [x] 运行 typecheck → 零错误（预存错误不变）

## 任务 3：RestJob 实体（TDD）

### 3.1 先写测试

- [x] 按 test-rest-job.md 规格，创建 `residential/domain/__tests__/rest-job.test.ts`
- [x] 运行测试 → 确认全部失败（RED）

### 3.2 再写实现

- [x] 创建 `residential/domain/entities/rest-job.ts`（start / canCollect / collect / ensureRester / rehydrate）
- [x] 创建 `residential/domain/rest-catalog.ts`（full_rest 静态配置）
- [x] 运行测试 → 全部 GREEN（14/14）

### 3.3 收尾

- [x] 运行 typecheck → 零错误

## 任务 4：住宅定价（TDD）

### 4.1 先写测试

- [x] 按 test-set-rest-price.md 规格，创建 `residential/application/__tests__/set-rest-price-use-case.test.ts`
- [x] 运行测试 → 确认全部失败（RED）

### 4.2 再写实现

- [x] 修改 Building 实体：新增 restPrice 属性 + setRestPrice + ensureResidential 方法
- [x] 修改 building infrastructure schema：新增 rest_price 列
- [x] 修改 building repository 映射：读写 restPrice
- [x] 创建 `residential/application/set-rest-price-use-case.ts`
- [x] 运行测试 → 全部 GREEN（223/223）

### 4.3 收尾

- [x] 运行 typecheck → 零错误

## 任务 5：发起休息（TDD）

### 5.1 先写测试

- [x] 按 test-start-rest.md 规格，创建 `residential/application/__tests__/start-rest-use-case.test.ts`
- [x] 运行测试 → 确认全部失败（RED）

### 5.2 再写实现

- [x] 创建 Repository 接口：`residential/domain/repositories/rest-job-repository.ts`
- [x] 新增 MoneyTransactionType：residential_rest / residential_rest_service
- [x] 创建 `residential/application/start-rest-use-case.ts`
- [x] 运行测试 → 全部 GREEN（232/232）
- 注：DB schema 和 Repository 实现留到任务 8（集成阶段）

### 5.3 收尾

- [x] 运行 typecheck → 零错误

## 任务 6：收取休息（TDD）

### 6.1 先写测试

- [x] 按 test-collect-rest.md 规格，创建 `residential/application/__tests__/collect-rest-use-case.test.ts`
- [x] 运行测试 → 确认全部失败（RED）

### 6.2 再写实现

- [x] 创建 `residential/application/collect-rest-use-case.ts`
- [x] 运行测试 → 全部 GREEN（6/6）

### 6.3 收尾

- [x] 运行 typecheck → 零错误

## 任务 7：查询休息任务（TDD）

### 7.1 先写测试

- [x] 按 test-list-rest-jobs.md 规格，创建 `residential/application/__tests__/list-rest-jobs-use-case.test.ts`
- [x] 运行测试 → 确认全部失败（RED）

### 7.2 再写实现

- [x] 创建 `residential/application/list-rest-jobs-use-case.ts`
- [x] 运行测试 → 全部 GREEN（4/4）

### 7.3 收尾

- [x] 运行 typecheck → 零错误

## 任务 8：Composition + Router 集成

### 8.1 实现

- [x] 创建 `residential/infrastructure/schema.ts`（residential_rest_jobs 表）
- [x] 创建 `residential/infrastructure/rest-job-repository.ts` + index.ts
- [x] 创建 `residential/domain/index.ts`
- [x] 创建 `residential/composition/index.ts`（Zod schema + 依赖注入 + facade 函数）
- [x] 创建 `residential/index.ts`（模块导出）
- [x] 创建 `src/server/lib/trpc/routers/residential.ts`（startRest / collectRest / restJobs / setRestPrice）
- [x] 注册到 `_app.ts` + `db/schema.ts`

### 8.2 收尾

- [x] 运行 typecheck → 零错误
- [x] 运行全量测试 → 全部 GREEN（242/242）

## 任务 9：DB Migration

- [ ] 手动运行 `DATABASE_URL=... npx drizzle-kit generate`（需要 TTY 交互确认 schema 变更）
- [ ] 手动运行 `DATABASE_URL=... npx drizzle-kit migrate`
- 变更内容：新建 residential_rest_jobs 表 + plot_buildings 新增 rest_price 列

## 任务 10：最终验证

- [ ] `vitest run` 全部通过
- [ ] `tsc --noEmit` 零错误
- [ ] 对照 3-test.md 验收标准逐项确认
