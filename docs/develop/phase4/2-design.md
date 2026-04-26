# Phase 4 Design：代码重构 — 可读性与解耦

## 一、总体原则

- **纯重构**：不改变外部行为，以现有 186 项测试为回归保障
- **依赖方向**：`shared-kernel ← domain modules ← application modules ← composition ← router`，不允许逆向引用
- **小步迭代**：每个重构项独立可提交、可验证

---

## 二、R1：拆分配方目录

### 2.1 目标文件结构

```
src/server/features/recipe/application/
├── recipes/
│   ├── procurement.ts      # 14 条采购配方定义
│   ├── processing.ts       # 24 条加工配方定义
│   └── assembly.ts         # 17 条组装配方定义
├── recipe-catalog.ts       # 查询函数（~80 行）：聚合三个子文件 + 提供筛选/查找 API
└── __tests__/
    └── recipe-catalog.test.ts  # 现有测试不变，仅 import 路径可能调整
```

### 2.2 配方定义类型

每个子文件导出一个 `Recipe[]` 数组。`Recipe` 类型定义保留在 `recipe-catalog.ts` 中并被子文件引用。

### 2.3 查询函数保持不变

`recipe-catalog.ts` 的对外 API（`listRecipes`, `getRecipeById`, `listRecipesByFactorySubtype`, `listRecipesByFactorySubtypeAndLevel`, `listDefaultRecipes`）签名和返回值完全不变。内部实现改为：

```typescript
import { procurementRecipes } from "./recipes/procurement";
import { processingRecipes } from "./recipes/processing";
import { assemblyRecipes } from "./recipes/assembly";

const ALL_RECIPES: Recipe[] = [
  ...procurementRecipes,
  ...processingRecipes,
  ...assemblyRecipes,
];
```

### 2.4 验证方式

- 现有 `recipe-catalog.test.ts` 全部测试通过
- 配方总数仍为 55 条

---

## 三、R2：提取独立 Factory 实体，消除 building ↔ factory 耦合

### 3.0 问题分析

当前 Building 实体承载了大量工厂专属逻辑：

| 位置 | 工厂专属内容 |
|------|-------------|
| `building/domain/entities/building.ts` | `subtype` 字段、`level` 字段、`ensureFactory()` 方法、`upgrade()` 方法 |
| `building/domain/factory-subtype.ts` | `FactorySubtype` 类型、`FACTORY_SUBTYPES` 常量、`MAX_FACTORY_LEVEL`、`isValidFactorySubtype()` |
| `building/application/build-building-use-case.ts` | 直接 import factory 模块的 `autoUnlockDefaultRecipes` 和 `UnlockedRecipeRepository` |

同时 factory 模块的 4 个 use case 全部依赖 `BuildingRepository` 来获取工厂状态（subtype、level）并调用 `building.ensureFactory()` / `building.upgrade()`。

这导致 building 和 factory **双向耦合**，且 Building 实体承担了不属于它的业务职责。

### 3.1 方案：提取 Factory 实体 + 回调钩子

核心思路：**Factory 成为 factory 模块的独立领域实体**，拥有自己的 Repository，从同一张 `plot_buildings` 表读写工厂专属字段。Building 实体瘦身为纯通用建筑。

**不改变数据库 schema**：Factory 实体和 Building 实体共享 `plot_buildings` 表，各自映射不同的关注字段。

### 3.2 新增 Factory 实体

```
src/server/features/factory/domain/
├── entities/
│   ├── factory.ts                    # 新增：工厂领域实体
│   └── factory-production-job.ts     # 已有
├── factory-subtype.ts                # 从 building/domain/ 迁移过来
├── repositories/
│   ├── factory-repository.ts         # 新增：工厂 Repository 接口
│   ├── factory-production-job-repository.ts
│   └── unlocked-recipe-repository.ts
└── index.ts
```

#### Factory 实体定义

```typescript
// factory/domain/entities/factory.ts
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { type FactorySubtype, MAX_FACTORY_LEVEL } from "../factory-subtype";

type FactoryProps = {
  id: number;          // 即 building.id
  plotId: number;
  subtype: FactorySubtype;
  level: number;
  createdAt: Date;
  updatedAt: Date;
};

export class Factory {
  private constructor(private props: FactoryProps) {}

  static rehydrate(props: FactoryProps): Factory {
    return new Factory(props);
  }

  /** 升级工厂等级 */
  upgrade(): void {
    if (this.props.level >= MAX_FACTORY_LEVEL) {
      throw new DomainError("已达最高等级");
    }
    this.props.level += 1;
    this.props.updatedAt = new Date();
  }

  get id() { return this.props.id; }
  get plotId() { return this.props.plotId; }
  get subtype() { return this.props.subtype; }
  get level() { return this.props.level; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
```

**关键**：Factory 不需要 `construct` 方法，因为工厂的创建仍由 Building 模块触发（建造建筑），Factory 记录的写入由 afterBuildHook 在 composition 层完成。

#### FactoryRepository 接口

```typescript
// factory/domain/repositories/factory-repository.ts
import type { Factory } from "../entities/factory";

export interface FactoryRepository {
  findByBuildingId(buildingId: number): Promise<Factory | null>;
  save(factory: Factory): Promise<Factory>;
}
```

#### FactoryRepository 实现

```typescript
// factory/infrastructure/factory-repository.ts
// 从 plot_buildings 表中 WHERE type = 'factory' 读取，映射为 Factory 实体
// save 时只更新 level 和 updatedAt（subtype 不可变）
```

### 3.3 迁移 factory-subtype.ts

**变更前**：`src/server/features/building/domain/factory-subtype.ts`
**变更后**：`src/server/features/factory/domain/factory-subtype.ts`

所有 import 路径同步更新。Building 模块不再持有工厂子类型定义。

### 3.4 Building 实体瘦身

从 Building 实体中移除工厂专属内容：

```diff
 // building/domain/entities/building.ts

-import { type FactorySubtype, isValidFactorySubtype, MAX_FACTORY_LEVEL }
-  from "@/server/features/building/domain/factory-subtype";

 type BuildingProps = {
   id: number;
   plotId: number;
   type: BuildingType;
-  subtype: FactorySubtype | null;
-  level: number;
+  subtype: string | null;       // 保留字段用于 DB 映射，但不再持有 FactorySubtype 领域类型
+  level: number;                // 保留字段用于 DB 映射
   status: BuildingStatus;
   createdAt: Date;
   updatedAt: Date;
 };

 // 移除以下方法：
-  ensureFactory(): FactorySubtype { ... }
-  upgrade(): void { ... }

 // construct 方法简化：不再校验工厂子类型（由 factory 模块负责）
 static construct(input: {
   id: number;
   plotId: number;
   type: BuildingType;
-  subtype?: FactorySubtype;
+  subtype?: string;
 }): Building { ... }
```

**注意**：`subtype` 和 `level` 字段保留在 Building 实体中用于 DB 映射和 API 返回（前端需要这些数据），但 Building 不再对它们施加业务逻辑。`ensureShop()` 和 `ensurePurchasingStation()` 保留不变。

### 3.5 消除 building → factory 依赖（回调钩子）

**变更前**：
```
build-building-use-case.ts:
  import { autoUnlockDefaultRecipes } from "../../factory/application/..."
  deps: { ..., unlockedRecipeRepository }
  // 建造成功后
  if (type === "factory") autoUnlockDefaultRecipes(id, subtype, deps.unlockedRecipeRepository)
```

**变更后**：
```
build-building-use-case.ts:
  deps: { ..., afterBuildHook?: (building: Building) => Promise<void> }
  // 建造成功后
  if (deps.afterBuildHook) await deps.afterBuildHook(savedBuilding)
```

在 **building 的 composition root**（`building/composition/index.ts`）中组装：

```typescript
import { autoUnlockDefaultRecipes } from "../../factory/application/auto-unlock-default-recipes";
import { UnlockedRecipeRepositoryImpl } from "../../factory/infrastructure/unlocked-recipe-repository";

const afterBuildHook = async (building: Building) => {
  if (building.type === "factory" && building.subtype) {
    await autoUnlockDefaultRecipes(building.id, building.subtype, new UnlockedRecipeRepositoryImpl());
  }
};
```

跨模块依赖只存在于 composition 层，application 层保持纯净。

### 3.6 Factory Use Case 改造

所有 factory use case 从依赖 `BuildingRepository` + `building.ensureFactory()` 改为依赖 `FactoryRepository`：

#### upgrade-factory-use-case.ts

```diff
-import type { BuildingRepository } from "@/server/features/building/domain/...";
+import type { FactoryRepository } from "@/server/features/factory/domain/...";

 type UpgradeFactoryUseCaseDeps = {
-  buildingRepository: BuildingRepository;
+  factoryRepository: FactoryRepository;
   plotRepository: PlotRepository;
   // ... 其他不变
 };

 // 执行逻辑：
-const building = await deps.buildingRepository.findById(command.buildingId);
-building.ensureFactory();
-building.upgrade();
-await deps.buildingRepository.save(building);
+const factory = await deps.factoryRepository.findByBuildingId(command.buildingId);
+if (!factory) return { ok: false, error: "该建筑不是工厂", code: "NOT_FOUND" };
+factory.upgrade();
+await deps.factoryRepository.save(factory);
```

#### unlock-recipe-use-case.ts

```diff
-const building = await deps.buildingRepository.findById(command.buildingId);
-subtype = building.ensureFactory();
-if (building.level < recipe.requiredLevel) { ... }
+const factory = await deps.factoryRepository.findByBuildingId(command.buildingId);
+if (!factory) return { ok: false, error: "该建筑不是工厂", code: "NOT_FOUND" };
+if (factory.level < recipe.requiredLevel) { ... }
+// subtype 直接用 factory.subtype
```

#### start-factory-production-use-case.ts

```diff
-building.ensureFactory();
+const factory = await deps.factoryRepository.findByBuildingId(command.buildingId);
+if (!factory) return { ok: false, error: "该建筑不是工厂", code: "NOT_FOUND" };
 // 其余逻辑不变，配方校验用 factory.subtype
```

**注意**：这些 use case 仍需 `BuildingRepository` 来获取 `building.plotId` 以校验地块归属。但不再用它获取工厂状态或调用工厂业务方法。

#### list-factory-recipes-use-case.ts

```diff
-const building = await deps.buildingRepository.findById(query.buildingId);
-const subtype = building.subtype;
-if (!subtype) return { ... };
-const filtered = listRecipesByFactorySubtypeAndLevel(subtype, building.level);
+const factory = await deps.factoryRepository.findByBuildingId(query.buildingId);
+if (!factory) return { ok: false, error: "该建筑不是工厂", code: "NOT_FOUND" };
+const filtered = listRecipesByFactorySubtypeAndLevel(factory.subtype, factory.level);
```

#### list-factory-orders-use-case.ts

```diff
-building.ensureFactory();
+const factory = await deps.factoryRepository.findByBuildingId(command.buildingId);
+if (!factory) return { ok: false, error: "该建筑不是工厂", code: "NOT_FOUND" };
```

### 3.7 改造后的依赖关系

```
变更前（双向耦合）：
  building ──import──> factory（autoUnlockDefaultRecipes, UnlockedRecipeRepository）
  factory  ──import──> building（BuildingRepository, Building.ensureFactory, Building.upgrade）

变更后（单向 + composition 层编排）：
  building ──(无)──> factory
  factory  ──import──> building（仅 BuildingRepository 用于校验地块归属）
  composition 层 ──import──> both（注入 afterBuildHook）
```

### 3.8 影响范围汇总

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `factory/domain/entities/factory.ts` | 新增 | Factory 领域实体 |
| `factory/domain/repositories/factory-repository.ts` | 新增 | FactoryRepository 接口 |
| `factory/infrastructure/factory-repository.ts` | 新增 | 从 `plot_buildings` 表实现 |
| `factory/domain/factory-subtype.ts` | 迁移 | 从 `building/domain/` 移入 |
| `factory/domain/index.ts` | 修改 | 导出 Factory、FactoryRepository |
| `building/domain/entities/building.ts` | 修改 | 移除 `ensureFactory()`、`upgrade()`；`subtype` 类型改为 `string \| null` |
| `building/domain/factory-subtype.ts` | 删除 | 已迁移至 factory 模块 |
| `building/application/build-building-use-case.ts` | 修改 | 移除 factory import，新增 `afterBuildHook` |
| `building/composition/index.ts` | 修改 | 注入 afterBuildHook |
| `factory/application/upgrade-factory-use-case.ts` | 修改 | 用 FactoryRepository 替代 BuildingRepository 获取工厂状态 |
| `factory/application/unlock-recipe-use-case.ts` | 修改 | 同上 |
| `factory/application/start-factory-production-use-case.ts` | 修改 | 同上 |
| `factory/application/list-factory-recipes-use-case.ts` | 修改 | 同上 |
| `factory/application/list-factory-orders-use-case.ts` | 修改 | 同上 |
| `factory/composition/index.ts` | 修改 | 注入 FactoryRepository 实例 |
| `building/application/building-cost-catalog.ts` | 修改 | import 路径改为 factory 模块 |
| 相关测试文件 | 修改 | 适配新的依赖和 import 路径 |

### 3.9 验证方式

- 全部现有测试通过（测试断言不变，仅 import 路径和依赖注入适配）
- `building/domain/entities/building.ts` 不再 import factory 相关内容
- `build-building-use-case.ts` 不再 import factory 模块的任何内容
- Factory use case 通过 `FactoryRepository` 获取工厂状态，不再调用 `building.ensureFactory()` / `building.upgrade()`
- `tsc --noEmit` 零错误

---

## 四、R3：提取付款服务

### 4.1 新增文件

```
src/server/features/shared-kernel/application/payment-service.ts
```

### 4.2 接口设计

```typescript
export type ChargeToSystemParams = {
  userId: string;
  amount: number;
  reason: string;
};

export type ChargeToSystemDeps = {
  userRepository: UserRepository;
  systemAccountService: SystemAccountService;
  transactionLedgerRepository: TransactionLedgerRepository;
};

export type ChargeResult =
  | { ok: true }
  | { ok: false; error: string; code: "INSUFFICIENT_FUNDS" };

export async function chargeUserToSystem(
  params: ChargeToSystemParams,
  deps: ChargeToSystemDeps,
): Promise<ChargeResult>;
```

### 4.3 内部逻辑

1. `userRepository.findById(userId)` → 获取用户
2. 校验 `user.money >= amount` → 不足则返回错误
3. `user.deductMoney(amount)`
4. `systemAccount.receiveMoney(amount)`
5. `userRepository.save(user)`
6. `userRepository.save(systemAccount)` （或 `systemAccountService.receiveMoney(amount)`）
7. `transactionLedgerRepository.save(...)` → 记录流水

### 4.4 调用方改造

四个用例各自的扣款段（~20 行）替换为：

```typescript
const chargeResult = await chargeUserToSystem(
  { userId: command.ownerUserId, amount: cost, reason: "建造建筑: mine" },
  { userRepository: deps.userRepository, systemAccountService: deps.systemAccountService, transactionLedgerRepository: deps.transactionLedgerRepository },
);
if (!chargeResult.ok) return chargeResult;
```

### 4.5 依赖精简效果

| 用例 | 变更前依赖数 | 变更后依赖数 | 减少 |
|-----|------------|------------|------|
| build-building | 7 | 5 (paymentService 封装了 3 个) | -2 |
| unlock-recipe | 6 | 4 | -2 |
| upgrade-factory | 5 | 3 | -2 |
| start-factory-production | 8 | 6 | -2 |

注：use case 不再直接依赖 userRepository/systemAccountService/transactionLedgerRepository 用于扣款，改为依赖 paymentService。但部分用例仍需 userRepository 用于其他用途（如读取用户信息），具体视代码而定。

---

## 五、R4：简化 Factory Composition Root

### 5.1 现状

```typescript
// composition/index.ts 中 5 个 wrapper 函数各自列出依赖：
export function executeUnlockRecipeUseCase(...) {
  return unlockRecipeUseCase(validated, {
    buildingRepository: new BuildingRepositoryImpl(),
    plotRepository: new PlotRepositoryImpl(),
    userRepository: new UserRepositoryImpl(),
    // ... 每个 wrapper 重复实例化
  });
}
```

### 5.2 方案：共享依赖对象

```typescript
// 顶层一次性构建
const sharedDeps = {
  buildingRepository: new BuildingRepositoryImpl(),
  plotRepository: new PlotRepositoryImpl(),
  userRepository: new UserRepositoryImpl(),
  transactionLedgerRepository: new TransactionLedgerRepositoryImpl(),
  systemAccountService: new SystemAccountServiceImpl(),
  inventoryRepository: new InventoryRepositoryImpl(),
  factoryProductionJobRepository: new FactoryProductionJobRepositoryImpl(),
  unlockedRecipeRepository: new UnlockedRecipeRepositoryImpl(),
  transact,
};

export function executeUnlockRecipeUseCase(input: UnlockRecipeInput) {
  const validated = unlockRecipeSchema.parse(input);
  return unlockRecipeUseCase(validated, sharedDeps);
}
```

每个 use case 只取自己需要的依赖（TypeScript 结构类型会自动兼容）。

### 5.3 注意事项

- Repository 实例需要确认是否可复用（无状态则可以，有状态则不行）
- 如果 repository 是无状态的纯包装器（查当前代码确认），则可以安全共享

---

## 六、R5：重构系统初始化

### 6.1 Step 注册表模式

```typescript
type StepDefinition = {
  name: string;
  execute: (deps: StepDeps) => Promise<StepResult>;
};

const STEPS: StepDefinition[] = [
  { name: "adam", execute: executeAdamStep },
  { name: "plot", execute: executePlotStep },
  { name: "bot1_manager", execute: executeBot1ManagerStep },
  { name: "bot1_manager_plot_purchase", execute: executeBot1ManagerPlotPurchaseStep },
  { name: "bot1_manager_purchasing_station_build", execute: executeBot1ManagerPurchasingStationBuildStep },
  { name: "bot1_manager_buy_orders", execute: executeBot1ManagerBuyOrdersStep },
];
```

### 6.2 主函数改造

```typescript
async function initializeSystem(deps: Deps): Promise<InitResult> {
  for (const step of STEPS) {
    const result = await step.execute(deps);
    if (!result.ok) {
      return { ok: false, completedSteps: [...], failedStep: step.name, error: result.error };
    }
  }
  return { ok: true, completedSteps: STEPS.map(s => s.name) };
}
```

### 6.3 预期效果

- 消除 119 行 switch 模板代码
- 新增步骤只需在 STEPS 数组中追加一项
- 主函数从 ~318 行降至 ~50 行

---

## 七、R6：客户端组件拆分（可选）

### 7.1 FactorySection 拆分

```
factory-section.tsx (208 行)
  → factory-section.tsx (~60 行，tab 切换 + 子组件编排)
  → factory-produce-tab.tsx (~80 行，配方筛选 + 生产触发)
  → factory-upgrade-tab.tsx (~60 行，升级预览 + 触发)
```

### 7.2 RecipeDetail 拆分

```
recipe-detail.tsx (190 行)
  → recipe-detail.tsx (~50 行，分发逻辑)
  → recipe-locked-card.tsx (~60 行，未解锁配方展示 + 解锁按钮)
  → recipe-unlocked-card.tsx (~80 行，已解锁配方展示 + 生产按钮)
```

### 7.3 优先级

客户端重构为**可选项**，优先级低于服务端重构（R1-R5）。如果时间不够可推迟。

---

## 八、重构顺序

按依赖关系和风险排序：

```
R1（拆分配方目录）    ← 最安全，无调用链变更，先做
    ↓
R3（提取付款服务）    ← 被 R2 和 R4 依赖
    ↓
R2（消除 building → factory 耦合） ← 依赖 R3 简化后的接口
    ↓
R4（简化 composition root）  ← 依赖 R3 的 paymentService
    ↓
R5（重构系统初始化）  ← 独立，可任意排序
    ↓
R6（客户端组件拆分）  ← 可选，最后做
```
