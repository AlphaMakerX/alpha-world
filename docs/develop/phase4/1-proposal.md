# Phase 4 Proposal：代码重构 — 可读性与解耦

## 目标

在不改变外部行为的前提下，解决 Phase 3 后代码库积累的五类结构性问题，使后续功能开发（邮箱系统、体力系统、实时交互等）能在更干净的基础上推进。

## 现状与问题

### 问题一：recipe-catalog.ts（982 行巨型数据文件）

**现状**：55 条配方定义 + 5 个查询函数全部放在一个文件中。配方对象字面量占据 ~900 行，查询函数被挤到文件末尾。

**影响**：
- 新增或修改单条配方需要在近千行中定位
- 采购、加工、组装三类配方混杂，难以按类别审查
- 测试文件（302 行）同样臃肿，和数据量强绑定

### 问题二：building → factory 跨模块耦合

**现状**：`build-building-use-case.ts` 在建造工厂成功后，直接调用 factory 模块的 `autoUnlockDefaultRecipes` 函数，并注入 `unlockedRecipeRepository`（factory 基础设施层的依赖）。

```
building/application/build-building-use-case.ts
  └─ imports autoUnlockDefaultRecipes from factory/application/
  └─ injects unlockedRecipeRepository (factory infrastructure concern)
```

**影响**：
- 违反模块边界：building 模块了解 factory 的解锁实现细节
- building 的依赖列表被 factory 的依赖污染（7 个依赖中有 1 个不属于 building）
- 如果 factory 的解锁逻辑变化，building 模块需要同步修改

### 问题三：重复的「扣款 → 转账 → 记流水」模式

**现状**：以下四个用例都独立实现了相同的事务模式：

| 用例 | 文件 | 相同模式 |
|-----|------|---------|
| 建造建筑 | `build-building-use-case.ts` | 校验余额 → 扣款 → 转入 Adam → 写 transaction_ledger |
| 解锁配方 | `unlock-recipe-use-case.ts` | 校验余额 → 扣款 → 转入 Adam → 写 transaction_ledger |
| 升级工厂 | `upgrade-factory-use-case.ts` | 校验余额 → 扣款 → 转入 Adam → 写 transaction_ledger |
| 启动生产 | `start-factory-production-use-case.ts` | 校验余额 → 扣款 → 转入 Adam → 写 transaction_ledger |

**影响**：
- 每个用例重复 ~20 行几乎相同的扣款逻辑
- 如果流水记录格式变更，需要改 4 处
- 新用例容易遗漏某个步骤（如忘记记流水）

### 问题四：Factory 模块依赖注入膨胀

**现状**：`start-factory-production-use-case.ts` 注入 8 个依赖（buildingRepository, plotRepository, userRepository, inventoryRepository, factoryProductionJobRepository, unlockedRecipeRepository, transactionLedgerRepository, systemAccountService）。composition root 在 5 个 wrapper 函数中重复列出部分相同的依赖。

**影响**：
- 函数签名冗长，阅读困难
- 新增用例时需要手动拼装依赖列表，容易遗漏
- composition root 的重复代码增加维护成本

### 问题五：系统初始化的 switch 膨胀

**现状**：`initialize-system-use-case.ts`（318 行）中，核心逻辑是一个 6 分支的 switch 语句，每个 case 结构完全相同（调用 step 函数 → 包装返回值），但各自独立编写。

**影响**：
- 新增初始化步骤需要复制 ~20 行模板代码
- 可读性差：真正的差异（step 函数调用）被模板代码淹没

## 重构方案概要

### R1：拆分配方目录

将 `recipe-catalog.ts` 拆为：
- `recipes/procurement.ts` — 采购类配方定义
- `recipes/processing.ts` — 加工类配方定义
- `recipes/assembly.ts` — 组装类配方定义
- `recipe-catalog.ts` — 仅保留查询函数，import 三个子文件的配方数组

### R2：消除 building → factory 耦合

**方案 A（回调钩子）**：建造用例接受一个可选的 `onFactoryBuilt(buildingId, subtype)` 回调，由 composition root 在组装时注入 factory 的自动解锁逻辑。building 模块本身不知道 factory 的存在。

**方案 B（路由层编排）**：将「建造 + 自动解锁」的编排逻辑上移到 tRPC 路由层或独立的 composition 函数中。building use case 只负责建造，调用方在建造成功后再调用 factory 的自动解锁。

推荐方案 A，因为事务完整性更好（回调在同一事务内执行）。

### R3：提取付款服务

新建 `shared-kernel/application/payment-service.ts`：

```typescript
type PaymentResult = { ok: true } | { ok: false; error: string; code: string };

function chargeUserToSystem(params: {
  userId: string;
  amount: number;
  reason: string; // 用于 transaction_ledger 描述
  deps: { userRepository; systemAccountService; transactionLedgerRepository; transact };
}): Promise<PaymentResult>;
```

四个用例统一调用此服务，消除重复的扣款逻辑。

### R4：简化 composition root

将 factory 的所有 infrastructure 依赖集中为一个 `FactoryDeps` 对象，composition root 一次性构建，多个 wrapper 函数共享引用。

### R5：重构系统初始化

将 switch 改为 step 注册表模式：

```typescript
const steps: Record<StepName, StepFunction> = {
  adam: executeAdamStep,
  plot: executePlotStep,
  // ...
};
```

主函数通过注册表查找并执行 step，消除重复的 case 模板。

## 约束与排除范围

- **不改变任何外部 API**：tRPC 路由的 input/output schema 保持不变
- **不改变数据库 schema**：不新增表、不改列
- **不新增功能**：不添加新的业务逻辑
- **不改变测试断言**：现有 186 项测试的断言内容不变（测试内部可能需要适配新的 import 路径）
- **不涉及前端功能变更**：客户端组件拆分是纯 UI 重构，不改变数据流

## 验收标准

- 全部 186 项现有测试通过
- `tsc --noEmit` 零错误
- `recipe-catalog.ts` 行数降至 100 行以内
- `build-building-use-case.ts` 不再 import factory 模块的任何内容
- 「扣款 → 转账 → 记流水」逻辑在代码库中只有一份实现
- `initialize-system-use-case.ts` 的 switch 语句被消除
