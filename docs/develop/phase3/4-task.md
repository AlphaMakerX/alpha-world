# Phase 3 Task：工厂配方解锁与专业化分工 — 开发任务清单

> 遵循 TDD 模式：RED → GREEN → typecheck。
> 按模块依赖顺序排列：先改底层（recipe、building），再改上层（factory），最后改路由层和数据库。

---

## 任务 0：数据库 Schema 变更

### 0.1 plot_buildings 表加列

- [x] 在 `src/server/features/building/infrastructure/schema.ts` 中，为 `plot_buildings` 表新增 `subtype`（varchar(30), nullable）和 `level`（integer, default 1）两列
- [x] 运行 `drizzle:push` 确认 schema 推送成功

### 0.2 新建 factory_unlocked_recipes 表

- [x] 在 `src/server/features/factory/infrastructure/` 下新建 `unlocked-recipe-schema.ts`，定义 `factory_unlocked_recipes` 表（复合主键 building_id + recipe_id，FK 到 plot_buildings CASCADE DELETE，unlocked_at 时间戳）
- [x] 运行 `drizzle:push` 确认 schema 推送成功

### 0.3 清档迁移

- [x] 编写一次性脚本或 SQL：删除所有 `type = 'factory'` 的 plot_buildings 记录（关联的 factory_production_jobs 通过 CASCADE 自动清除）
- [x] 执行后确认非 factory 类型的建筑（residential、shop、purchasing_station）不受影响

---

## 任务 1：recipe 模块 — 配方元数据扩展（TDD）

### 1.1 先写测试

- [x] 创建 `src/server/features/recipe/application/__tests__/recipe-catalog.test.ts`
- [x] 测试用例：
  - `listRecipes()` 返回 55 条配方（54 现有 + 1 新增 buy_water_bulk）
  - 每条配方都有 `factorySubtypes`、`unlockCost`、`requiredLevel` 字段
  - `getRecipeById("buy_water_bulk")` 返回正确的高效产水配方数据
  - `buy_water` 的 `factorySubtypes` 为 `"*"`（通用）
  - `buy_water_bulk` 的 `factorySubtypes` 仅包含 `"waterworks"`
- [x] 运行测试 → 确认全部失败（RED）

### 1.2 先写测试 — 按工厂类型筛选

- [x] 在同一测试文件中新增测试用例：
  - `listRecipesByFactorySubtype("mine")` 返回采矿场可用的配方列表（含通用配方 buy_water）
  - `listRecipesByFactorySubtype("waterworks")` 返回 buy_water + buy_water_bulk
  - `listRecipesByFactorySubtype("mine")` 不包含 `buy_wood`（伐木场独占）
  - `listRecipesByFactorySubtype("assembler")` 不包含任何 procurement 类别的采购配方（除 buy_water）
- [x] 运行测试 → 确认全部失败（RED）

### 1.3 先写测试 — 按等级过滤

- [x] 在同一测试文件中新增测试用例：
  - `listRecipesByFactorySubtypeAndLevel("mine", 1)` 仅返回等级 1 的配方
  - `listRecipesByFactorySubtypeAndLevel("mine", 2)` 返回等级 1 + 等级 2 的配方
  - `listRecipesByFactorySubtypeAndLevel("mine", 3)` 返回全部该类型配方
- [x] 运行测试 → 确认全部失败（RED）

### 1.4 再写实现

- [x] 在 `recipe-catalog.ts` 中：
  - 扩展 `Recipe` 类型，新增 `factorySubtypes`、`unlockCost`、`requiredLevel`、`defaultUnlocked` 字段
  - 为现有 54 条配方补充元数据（按 2-design.md 第四节映射表）
  - 新增 `buy_water_bulk` 配方
- [x] 新增查询函数：
  - `listRecipesByFactorySubtype(subtype)` — 按工厂子类型筛选
  - `listRecipesByFactorySubtypeAndLevel(subtype, level)` — 按子类型 + 等级筛选
  - `listDefaultRecipes(subtype)` — 返回某类型工厂建成后自动解锁的配方
- [x] 运行测试 → 全部 GREEN

### 1.5 收尾

- [x] 运行 `tsc --noEmit` → 零错误

---

## 任务 2：building 模块 — 工厂子类型与等级（TDD）

### 2.1 先写测试 — FactorySubtype 枚举

- [x] 创建 `src/server/features/building/domain/__tests__/factory-subtype.test.ts`
- [x] 测试用例：
  - `FACTORY_SUBTYPES` 包含全部 10 种类型
  - `isValidFactorySubtype("mine")` 返回 true
  - `isValidFactorySubtype("invalid_type")` 返回 false
- [x] 运行测试 → 确认全部失败（RED）

### 2.2 先写测试 — Building 实体扩展

- [x] 创建 `src/server/features/building/domain/__tests__/building.test.ts`
- [x] 测试用例：
  - `Building.construct({ type: "factory", subtype: "mine" })` 创建的建筑 level 为 1、subtype 为 "mine"
  - `Building.construct({ type: "factory" })` 不传 subtype 时抛出错误
  - `Building.construct({ type: "residential" })` 不传 subtype 正常创建，subtype 为 null
  - `building.upgrade()` 将 level 从 1 升为 2
  - `building.upgrade()` 连续调用，level 从 2 升为 3
  - `building.upgrade()` 在 level=3 时抛出「已达最高等级」错误
  - 非 factory 类型调用 `upgrade()` 抛出错误
  - `building.ensureFactory()` 成功时返回 subtype
- [x] 运行测试 → 确认全部失败（RED）

### 2.3 再写实现 — FactorySubtype

- [x] 在 `src/server/features/building/domain/` 下新建 `factory-subtype.ts`
  - 定义 `FactorySubtype` 类型（10 种工厂类型的联合类型）
  - 导出 `FACTORY_SUBTYPES` 常量数组
  - 导出 `isValidFactorySubtype()` 校验函数
  - 导出 `MAX_FACTORY_LEVEL` 常量（值为 3）
- [x] 运行 factory-subtype 测试 → GREEN

### 2.4 再写实现 — Building 实体

- [x] 修改 `src/server/features/building/domain/entities/building.ts`：
  - `BuildingProps` 新增 `subtype: FactorySubtype | null` 和 `level: number`
  - `Building.construct()` 入参新增可选 `subtype`，当 type 为 factory 时校验 subtype 必填且有效
  - 新增 `upgrade()` 方法：校验是工厂 + 未达上限，然后 level + 1
  - `ensureFactory()` 改为返回 `FactorySubtype`（返回 subtype 值）
  - 新增 `subtype` 和 `level` getter
- [x] 运行 building 测试 → 全部 GREEN

### 2.5 先写测试 — 建造费用目录

- [x] 创建 `src/server/features/building/application/__tests__/building-cost-catalog.test.ts`
- [x] 测试用例：
  - `getBuildingCost("factory", "mine")` 返回 800
  - `getBuildingCost("factory", "assembler")` 返回 1200
  - `getBuildingCost("factory", "waterworks")` 返回 600
  - `getBuildingCost("residential")` 返回 500（无 subtype）
- [x] 运行测试 → 确认全部失败（RED）

### 2.6 再写实现 — 建造费用目录

- [x] 修改 `src/server/features/building/application/building-cost-catalog.ts`：
  - `getBuildingCost` 函数签名改为接受 `(type, subtype?)` 两个参数
  - 当 type 为 factory 时按 subtype 查表（10 种子类型各自的费用）
  - 非 factory 类型走原有逻辑
- [x] 运行测试 → 全部 GREEN

### 2.7 先写测试 — 建造建筑用例

- [x] 创建 `src/server/features/building/application/__tests__/build-building-use-case.test.ts`
- [x] 测试用例：
  - 建造工厂时传入 `factorySubtype: "mine"`，成功返回的 building 包含 subtype 和 level=1
  - 建造工厂时不传 `factorySubtype`，返回错误
  - 建造工厂时传入无效 subtype，返回错误
  - 建造 residential 时不传 subtype，正常成功
  - 建造 mine 扣费 800，建造 assembler 扣费 1200
- [x] 运行测试 → 确认全部失败（RED）

### 2.8 再写实现 — 建造建筑用例

- [x] 修改 `src/server/features/building/application/build-building-use-case.ts`：
  - `BuildBuildingCommand` 新增可选 `factorySubtype` 字段
  - 校验逻辑：type 为 factory 时 factorySubtype 必填且有效
  - 调用 `getBuildingCost(type, subtype)` 计算费用
  - 调用 `Building.construct()` 时传入 subtype
  - 成功返回结果中包含 subtype 和 level
- [x] 运行测试 → 全部 GREEN

### 2.9 先写测试 — Building Repository（持久化层）

- [x] 创建 `src/server/features/building/infrastructure/__tests__/building-repository.test.ts`
- [x] 测试用例：
  - 保存带 subtype 和 level 的 factory 建筑后，findById 读取出正确的 subtype 和 level
  - 保存 residential 建筑（subtype=null），findById 读取出 subtype 为 null、level 为 1
  - 保存后修改 level（模拟升级），再次 save，findById 读取到更新后的 level
- [x] 运行测试 → 确认全部失败（RED）

### 2.10 再写实现 — Building Repository

- [x] 修改 `src/server/features/building/infrastructure/building-repository.ts`：
  - 保存时写入 subtype 和 level 字段
  - 读取时映射 subtype 和 level 到 Building 实体
- [x] 运行测试 → 全部 GREEN

### 2.11 收尾

- [x] 运行 `tsc --noEmit` → 零错误

---

## 任务 3：factory 模块 — 解锁配方用例（TDD）

### 3.1 先写测试 — UnlockedRecipeRepository

- [x] 创建 `src/server/features/factory/infrastructure/__tests__/unlocked-recipe-repository.test.ts`
- [x] 测试用例：
  - `save(buildingId, recipeId)` 写入后，`findByBuildingId(buildingId)` 包含该 recipeId
  - `isUnlocked(buildingId, recipeId)` 已解锁时返回 true，未解锁返回 false
  - `findByBuildingId(buildingId)` 返回该工厂全部已解锁配方的 recipeId 列表
  - 重复 save 同一 (buildingId, recipeId) 不报错（幂等）
  - `saveBatch(buildingId, recipeIds)` 批量写入多条记录
- [x] 运行测试 → 确认全部失败（RED）

### 3.2 再写实现 — UnlockedRecipeRepository

- [x] 新建 `src/server/features/factory/domain/repositories/unlocked-recipe-repository.ts`（接口定义）
- [x] 新建 `src/server/features/factory/infrastructure/unlocked-recipe-repository.ts`（实现）
  - 基于 `factory_unlocked_recipes` 表实现 save / saveBatch / isUnlocked / findByBuildingId
- [x] 运行测试 → 全部 GREEN

### 3.3 先写测试 — 解锁配方用例

- [x] 创建 `src/server/features/factory/application/__tests__/unlock-recipe-use-case.test.ts`
- [x] 测试用例（使用 mock deps）：
  - **成功**：工厂 subtype=mine、level=1，解锁 buy_iron_ore（类型匹配、等级达标、金币充足）→ 返回 ok，扣款 50 金币
  - **类型不匹配**：mine 工厂尝试解锁 buy_wood → 返回错误「该工厂类型无法使用此配方」
  - **等级不足**：mine 工厂 level=1 尝试解锁 kiln_brick（需要 level 2）→ 返回错误「工厂等级不足」
  - **金币不足**：金币余额不足 → 返回错误
  - **幂等**：已解锁的配方再次请求 → 返回成功，不扣款
  - **通用配方**：mine 工厂解锁 buy_water → 成功（通用配方所有类型可用）
  - **配方不存在**：recipeId 无效 → 返回错误
  - **建筑不存在**：buildingId 无效 → 返回错误
  - **非工厂建筑**：建筑类型为 shop → 返回错误
  - **非所有者**：非地块拥有者操作 → 返回错误
- [x] 运行测试 → 确认全部失败（RED）

### 3.4 再写实现 — 解锁配方用例

- [x] 新建 `src/server/features/factory/application/unlock-recipe-use-case.ts`
  - 接收 `{ ownerUserId, buildingId, recipeId }` 命令
  - 依赖：buildingRepository, plotRepository, userRepository, unlockedRecipeRepository, transactionLedgerRepository, systemAccountService, transact
  - 实现流程：获取建筑 → ensureFactory → 获取配方元数据 → 校验类型匹配 → 校验等级 → 检查幂等 → 校验金币 → 事务扣款+写入解锁记录+记录流水
- [x] 运行测试 → 全部 GREEN

### 3.5 收尾

- [x] 运行 `tsc --noEmit` → 零错误

---

## 任务 4：factory 模块 — 升级工厂用例（TDD）

### 4.1 先写测试

- [x] 创建 `src/server/features/factory/application/__tests__/upgrade-factory-use-case.test.ts`
- [x] 测试用例（使用 mock deps）：
  - **成功 1→2**：level=1 工厂，金币充足 → 返回 ok，扣款 1000，building.level 变为 2
  - **成功 2→3**：level=2 工厂，金币充足 → 返回 ok，扣款 3000，building.level 变为 3
  - **已达上限**：level=3 工厂 → 返回错误「已达最高等级」
  - **金币不足**：余额不足以支付升级费用 → 返回错误
  - **非工厂建筑**：建筑类型为 residential → 返回错误
  - **建筑不存在**：buildingId 无效 → 返回错误
  - **非所有者**：非地块拥有者操作 → 返回错误
- [x] 运行测试 → 确认全部失败（RED）

### 4.2 再写实现

- [x] 新建 `src/server/features/factory/application/upgrade-factory-use-case.ts`
  - 接收 `{ ownerUserId, buildingId }` 命令
  - 新建 `upgrade-cost-catalog.ts`：定义升级费用查表逻辑（level 1→2: 1000, 2→3: 3000）
  - 实现流程：获取建筑 → ensureFactory → 计算升级费用 → 校验金币 → 事务扣款+building.upgrade()+save+记录流水
- [x] 运行测试 → 全部 GREEN

### 4.3 收尾

- [x] 运行 `tsc --noEmit` → 零错误

---

## 任务 5：factory 模块 — 改造启动生产用例（TDD）

### 5.1 先写测试

- [x] 创建 `src/server/features/factory/application/__tests__/start-factory-production-use-case.test.ts`（或扩展已有测试文件）
- [x] 新增测试用例：
  - **已解锁配方**：工厂已解锁 buy_iron_ore → 生产正常启动（走完原有流程）
  - **未解锁配方**：工厂未解锁 buy_wood → 返回错误「该工厂尚未解锁此配方」
  - **原有测试保持通过**：确保已有的校验逻辑（建筑不存在、配方不存在、进行中任务、地块归属、余额不足、材料不足）不被破坏
- [x] 运行测试 → 新增用例失败，原有用例状态视实现而定（RED）

### 5.2 再写实现

- [x] 修改 `src/server/features/factory/application/start-factory-production-use-case.ts`：
  - `StartFactoryProductionUseCaseDeps` 新增 `unlockedRecipeRepository` 依赖
  - 在 `building.ensureFactory()` 之后、缩放输入材料之前，新增校验步骤：
    - 调用 `unlockedRecipeRepository.isUnlocked(buildingId, recipeId)`
    - 未解锁则返回 `{ ok: false, error: "该工厂尚未解锁此配方", code: "CONFLICT" }`
- [x] 运行测试 → 全部 GREEN

### 5.3 收尾

- [x] 运行 `tsc --noEmit` → 零错误

---

## 任务 6：factory 模块 — 改造查询配方接口（TDD）

### 6.1 先写测试

- [x] 创建 `src/server/features/factory/application/__tests__/list-factory-recipes-use-case.test.ts`
- [x] 测试用例：
  - **按工厂查询**：传入 buildingId（mine 工厂，level=2），返回 mine 类型 level≤2 的配方列表，每条标注 `unlocked: boolean`
  - **已解锁标注**：工厂已解锁 buy_iron_ore，该配方 unlocked=true；未解锁的 kiln_brick unlocked=false
  - **通用配方包含**：返回列表中包含 buy_water
  - **不含其他类型配方**：mine 工厂查询不返回 buy_wood
  - **无 buildingId 查询**：返回全量 55 条配方（兼容旧接口）
- [x] 运行测试 → 确认全部失败（RED）

### 6.2 再写实现

- [x] 新建 `src/server/features/factory/application/list-factory-recipes-use-case.ts`
  - 接收 `{ buildingId?: number, ownerUserId: string }` 查询参数
  - 有 buildingId 时：获取建筑 → 读 subtype/level → 用 `listRecipesByFactorySubtypeAndLevel` 筛选 → 查 unlockedRecipeRepository 标注解锁状态
  - 无 buildingId 时：返回 `listRecipes()` 全量
- [x] 运行测试 → 全部 GREEN

### 6.3 收尾

- [x] 运行 `tsc --noEmit` → 零错误

---

## 任务 7：factory 模块 — 建造后默认解锁（TDD）

### 7.1 先写测试

- [x] 创建 `src/server/features/factory/application/__tests__/auto-unlock-default-recipes.test.ts`
- [x] 测试用例：
  - 调用 `autoUnlockDefaultRecipes(buildingId, "mine")` → unlockedRecipeRepository.saveBatch 被调用，参数包含 buy_iron_ore 和 buy_water
  - 调用 `autoUnlockDefaultRecipes(buildingId, "waterworks")` → saveBatch 参数包含 buy_water 和 buy_water_bulk
  - 调用 `autoUnlockDefaultRecipes(buildingId, "assembler")` → saveBatch 参数仅包含 buy_water
- [x] 运行测试 → 确认全部失败（RED）

### 7.2 再写实现

- [x] 新建 `src/server/features/factory/application/auto-unlock-default-recipes.ts`
  - 调用 `listDefaultRecipes(subtype)` 获取默认配方列表
  - 调用 `unlockedRecipeRepository.saveBatch(buildingId, recipeIds)` 写入
- [x] 运行测试 → 全部 GREEN

### 7.3 集成到建造流程

- [x] 修改 `build-building-use-case.ts`：
  - 新增依赖 `unlockedRecipeRepository`
  - 在建造 factory 类型的建筑成功后（事务内），调用 `autoUnlockDefaultRecipes`
- [x] 运行任务 2 的建造用例测试 → 确认不 break（可能需要补充 mock）
- [x] 运行 `tsc --noEmit` → 零错误

---

## 任务 8：tRPC 路由层适配（TDD）

### 8.1 先写测试 — building 路由

- [x] 修改或新建 `src/server/lib/trpc/routers/__tests__/building.test.ts`
- [x] 测试用例：
  - `building.build` mutation 接受 `factorySubtype` 参数
  - type=factory 时 factorySubtype 必填，缺失则报 validation error
  - type=residential 时不需要 factorySubtype

### 8.2 再写实现 — building 路由

- [x] 修改 `src/server/lib/trpc/routers/building.ts`：
  - `build` mutation 的 input schema 新增可选 `factorySubtype` 字段
  - 将 factorySubtype 透传给 `BuildBuildingCommand`

### 8.3 先写测试 — factory 路由

- [x] 修改或新建 `src/server/lib/trpc/routers/__tests__/factory.test.ts`
- [x] 测试用例：
  - `factory.unlockRecipe` mutation 接受 `{ buildingId, recipeId }`
  - `factory.upgradeFactory` mutation 接受 `{ buildingId }`
  - `factory.recipes` query 接受可选 `{ buildingId }`

### 8.4 再写实现 — factory 路由

- [x] 修改 `src/server/lib/trpc/routers/factory.ts`：
  - 新增 `unlockRecipe` mutation → 调用 unlock-recipe-use-case
  - 新增 `upgradeFactory` mutation → 调用 upgrade-factory-use-case
  - 修改 `recipes` query → 支持可选 buildingId 参数，调用 list-factory-recipes-use-case
  - 修改 `startProduction` mutation → 注入 unlockedRecipeRepository 依赖

### 8.5 收尾

- [x] 运行全部路由测试 → GREEN
- [x] 运行 `tsc --noEmit` → 零错误

---

## 任务 9：全量回归与验收

### 9.1 全量测试

- [x] 运行 `npm test` → 全部测试通过（186 tests, 22 files）
- [x] 运行 `tsc --noEmit` → 零错误

### 9.2 手动冒烟验证（可选）

- [ ] 启动本地服务，确认以下流程可走通：
  - 购买地块 → 建造 mine 工厂 → 自动获得 buy_iron_ore + buy_water
  - 用 buy_iron_ore 启动生产 → 成功
  - 尝试用未解锁的 kiln_brick 生产 → 被拒绝
  - 花钱解锁 kiln_brick → 被拒绝（等级不足，需 level 2）
  - 升级工厂到 level 2 → 扣款 1000
  - 再次解锁 kiln_brick → 成功，扣款 200
  - 用 kiln_brick 生产 → 成功

### 9.3 验收检查清单

- [x] 建造工厂必须选择子类型，10 种类型均可建造
- [x] 新建工厂自动解锁 1-2 个默认配方
- [x] 配方解锁校验：类型匹配 + 等级达标 + 金币充足
- [x] 解锁幂等：重复解锁不扣费
- [x] 工厂升级：level 1→2→3，费用递增，3 级封顶
- [x] 生产校验：未解锁配方无法启动生产
- [x] 配方查询：按工厂类型和等级筛选，标注解锁状态
- [x] 稀缺性：单一工厂无法生产所有物品
