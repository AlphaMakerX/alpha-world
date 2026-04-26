# Phase 4 Task：代码重构 — 开发任务清单

> 原则：每个任务独立可提交。每步完成后运行全量测试 + tsc --noEmit 确认无回归。
> 按依赖顺序排列：R1 → R3 → R2 → R4 → R5 → R6（可选）。

---

## 任务 R1：拆分配方目录

### R1.1 创建配方子文件

- [ ] 新建 `src/server/features/recipe/application/recipes/procurement.ts`
  - 从 `recipe-catalog.ts` 中提取所有 `category: "procurement"` 的配方定义
  - 导出 `procurementRecipes: Recipe[]`
- [ ] 新建 `src/server/features/recipe/application/recipes/processing.ts`
  - 从 `recipe-catalog.ts` 中提取所有 `category: "processing"` 的配方定义
  - 导出 `processingRecipes: Recipe[]`
- [ ] 新建 `src/server/features/recipe/application/recipes/assembly.ts`
  - 从 `recipe-catalog.ts` 中提取所有 `category: "assembly"` 的配方定义
  - 导出 `assemblyRecipes: Recipe[]`

### R1.2 改造 recipe-catalog.ts

- [ ] 移除所有配方对象字面量，改为 import 三个子文件
- [ ] `ALL_RECIPES` 改为 `[...procurementRecipes, ...processingRecipes, ...assemblyRecipes]`
- [ ] `Recipe` 类型定义保留在 `recipe-catalog.ts` 中
- [ ] 所有查询函数签名和逻辑不变

### R1.3 验证

- [ ] 运行 `recipe-catalog.test.ts` → 全部 GREEN
- [ ] 运行全量测试 → 全部 GREEN
- [ ] `tsc --noEmit` → 零错误
- [ ] 确认 `recipe-catalog.ts` 行数 ≤ 100 行

---

## 任务 R3：提取付款服务

### R3.1 分析现有扣款逻辑

- [ ] 阅读以下四个文件中的扣款段，记录共同模式和差异：
  - `build-building-use-case.ts`
  - `unlock-recipe-use-case.ts`
  - `upgrade-factory-use-case.ts`
  - `start-factory-production-use-case.ts`
- [ ] 确认 transaction_ledger 的记录格式（字段名、reason 格式）

### R3.2 编写付款服务测试

- [ ] 新建 `src/server/features/shared-kernel/application/__tests__/payment-service.test.ts`
- [ ] 测试用例：
  - **成功扣款**：用户余额充足 → 扣款成功，系统账户收款，流水记录写入
  - **余额不足**：用户余额不足 → 返回 INSUFFICIENT_FUNDS 错误，不扣款
  - **金额为 0**：amount=0 时是否允许（视现有行为决定）
- [ ] 运行测试 → RED

### R3.3 实现付款服务

- [ ] 新建 `src/server/features/shared-kernel/application/payment-service.ts`
- [ ] 实现 `chargeUserToSystem(params, deps)` 函数
- [ ] 运行测试 → GREEN

### R3.4 迁移调用方（逐个替换）

- [ ] 替换 `build-building-use-case.ts` 中的扣款逻辑 → 调用 `chargeUserToSystem`
  - 更新 deps 类型
  - 运行 building 相关测试 → GREEN
- [ ] 替换 `unlock-recipe-use-case.ts` → 调用 `chargeUserToSystem`
  - 运行 unlock-recipe 测试 → GREEN
- [ ] 替换 `upgrade-factory-use-case.ts` → 调用 `chargeUserToSystem`
  - 运行 upgrade-factory 测试 → GREEN
- [ ] 替换 `start-factory-production-use-case.ts` → 调用 `chargeUserToSystem`
  - 运行 start-production 测试 → GREEN

### R3.5 验证

- [ ] 运行全量测试 → 全部 GREEN
- [ ] `tsc --noEmit` → 零错误
- [ ] 确认代码库中不再有重复的「校验余额 → 扣款 → 转入系统 → 记流水」逻辑

---

## 任务 R2：消除 building → factory 耦合

### R2.1 改造 build-building-use-case

- [ ] 在 `BuildBuildingUseCaseDeps` 类型中：
  - 移除 `unlockedRecipeRepository`
  - 新增 `afterBuildHook?: (building: Building) => Promise<void>`
- [ ] 在建造成功后的 factory 分支中：
  - 移除 `autoUnlockDefaultRecipes` 的直接调用
  - 替换为 `if (deps.afterBuildHook) await deps.afterBuildHook(savedBuilding)`
- [ ] 移除 `import { autoUnlockDefaultRecipes } from "../../factory/..."` 引用

### R2.2 改造 building composition root

- [ ] 在 `src/server/features/building/composition/index.ts` 中：
  - 新增 import：`autoUnlockDefaultRecipes` 和 `UnlockedRecipeRepositoryImpl`
  - 构建 `afterBuildHook` 回调函数
  - 注入到 `BuildBuildingUseCaseDeps` 中

### R2.3 更新测试

- [ ] 修改 `build-building-use-case.test.ts`：
  - 将 `unlockedRecipeRepository` mock 改为 `afterBuildHook` mock（jest.fn / vi.fn）
  - 断言建造 factory 时 hook 被调用，建造 residential 时 hook 不被调用
- [ ] 运行 building 测试 → 全部 GREEN

### R2.4 验证

- [ ] 运行全量测试 → 全部 GREEN
- [ ] `tsc --noEmit` → 零错误
- [ ] 确认 `build-building-use-case.ts` 无任何 factory 模块的 import

---

## 任务 R4：简化 Factory Composition Root

### R4.1 抽取共享依赖

- [ ] 在 `src/server/features/factory/composition/index.ts` 中：
  - 顶层声明 `sharedDeps` 对象，一次性实例化所有 repository 和 service
  - 确认 repository 实现是无状态的（可安全共享实例）

### R4.2 简化 wrapper 函数

- [ ] 每个 `executeXxxUseCase` wrapper 函数改为引用 `sharedDeps`
- [ ] 移除各 wrapper 中重复的 `new XxxRepositoryImpl()` 调用

### R4.3 验证

- [ ] 运行全量测试 → 全部 GREEN
- [ ] `tsc --noEmit` → 零错误
- [ ] 确认 composition root 中每个 repository 只实例化一次

---

## 任务 R5：重构系统初始化

### R5.1 定义 Step 注册表

- [ ] 在 `initialize-system-use-case.ts` 中定义：
  - `StepDefinition` 类型：`{ name: string; execute: (deps) => Promise<StepResult> }`
  - `STEPS` 数组：按顺序列出全部 6 个步骤

### R5.2 改造主函数

- [ ] 将 switch 语句替换为 for 循环遍历 `STEPS`
- [ ] 保持返回值格式不变（兼容现有调用方）

### R5.3 验证

- [ ] 运行系统初始化相关测试（如有）→ GREEN
- [ ] 运行全量测试 → 全部 GREEN
- [ ] `tsc --noEmit` → 零错误
- [ ] 确认 `initialize-system-use-case.ts` 行数降低 ≥ 100 行

---

## 任务 R6：客户端组件拆分（可选）

### R6.1 拆分 FactorySection

- [ ] 新建 `factory-produce-tab.tsx`：从 `factory-section.tsx` 中提取生产相关逻辑
- [ ] 新建 `factory-upgrade-tab.tsx`：从 `factory-section.tsx` 中提取升级相关逻辑
- [ ] `factory-section.tsx` 仅保留 tab 切换和子组件编排

### R6.2 拆分 RecipeDetail

- [ ] 新建 `recipe-locked-card.tsx`：未解锁配方展示 + 解锁按钮
- [ ] 新建 `recipe-unlocked-card.tsx`：已解锁配方展示 + 生产按钮
- [ ] `recipe-detail.tsx` 仅保留分发逻辑

### R6.3 验证

- [ ] 页面功能与拆分前一致（手动验证）
- [ ] `tsc --noEmit` → 零错误

---

## 最终验收

- [ ] 全量测试通过（186+ tests）
- [ ] `tsc --noEmit` 零错误
- [ ] `recipe-catalog.ts` ≤ 100 行
- [ ] `build-building-use-case.ts` 无 factory 模块 import
- [ ] 「扣款 → 转账 → 记流水」逻辑只有一份实现（payment-service.ts）
- [ ] `initialize-system-use-case.ts` 无 switch 语句
- [ ] factory composition root 中每个 repository 只实例化一次
