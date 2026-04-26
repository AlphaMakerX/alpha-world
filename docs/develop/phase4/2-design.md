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

## 三、R2：消除 building → factory 耦合

### 3.1 方案：回调钩子

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

### 3.2 钩子注入位置

在 **building 的 composition root**（`src/server/features/building/composition/index.ts`）中组装：

```typescript
import { autoUnlockDefaultRecipes } from "../../factory/application/auto-unlock-default-recipes";
import { UnlockedRecipeRepositoryImpl } from "../../factory/infrastructure/unlocked-recipe-repository";

const afterBuildHook = async (building: Building) => {
  if (building.type === "factory" && building.subtype) {
    await autoUnlockDefaultRecipes(building.id, building.subtype, new UnlockedRecipeRepositoryImpl());
  }
};
```

**关键**：跨模块依赖只存在于 composition 层（组装层），application 层（use case）保持纯净。这符合 DDD 的 composition root 允许了解所有模块的设计原则。

### 3.3 影响范围

- `build-building-use-case.ts`：移除 factory 相关 import 和 `unlockedRecipeRepository` 依赖，新增可选 `afterBuildHook`
- `building/composition/index.ts`：新增 factory 相关 import，构建 hook 并注入
- `build-building-use-case.test.ts`：将 `unlockedRecipeRepository` mock 改为 `afterBuildHook` mock

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
