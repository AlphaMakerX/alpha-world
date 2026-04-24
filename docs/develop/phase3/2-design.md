# Phase 3 Design：工厂配方解锁与专业化分工

## 一、总体架构

### 1.1 受影响模块

本次改动涉及以下模块，按影响程度排列：

- **recipe 模块**（重度改造）：配方增加工厂类型归属、解锁费用、等级要求等元数据；新增高效产水配方
- **factory 模块**（重度改造）：新增配方解锁、工厂升级两个用例；生产启动增加解锁校验
- **building 模块**（中度改造）：建筑实体新增 subtype 和 level 字段；建造流程支持工厂子类型选择
- **item 模块**（轻度改造）：新增 water 物品无变化，仅配合新配方

不受影响的模块：shop、purchasing-station、inventory、plot、person（接口不变，自然受益于交易动机的增加）

### 1.2 模块依赖关系

```
building ──────────┐
                   ▼
factory ──────► recipe（配方元数据：类型归属、解锁费用、等级要求）
   │
   ├──► building（读取 subtype / level）
   ├──► inventory（消耗/产出物品）
   └──► person（扣款/转账）
```

核心变化：factory 模块从「直接使用全量配方」变为「通过 recipe 元数据 + 工厂解锁状态来筛选可用配方」。

### 1.3 新增数据流

**建造工厂**：
玩家选择工厂子类型 → building 模块创建带 subtype 和 level=1 的建筑 → factory 模块自动为该建筑解锁默认配方（1-2 个基础采购配方）

**解锁配方**：
玩家选择要解锁的配方 → factory 模块校验（类型匹配 + 等级达标 + 金币充足）→ 扣款 → 写入解锁记录

**升级工厂**：
玩家发起升级 → factory 模块校验（未达上限 + 金币充足）→ 扣款 → 更新 building 的 level 字段

**启动生产**（在现有流程中插入一步校验）：
现有校验 → **新增：检查该工厂是否已解锁该配方** → 继续原有生产流程

**查询可用配方**：
读取工厂 subtype 和 level → 从 recipe 元数据中筛选该类型可用的配方 → 关联解锁记录，标注每个配方的解锁状态 → 返回

---

## 二、数据模型变更

### 2.1 plot_buildings 表变更

在现有 `plot_buildings` 表中新增两列：

- **subtype**（varchar(30), nullable）：工厂子类型。仅当 `type = 'factory'` 时有值，其余建筑类型为 null。有效值为 10 种工厂类型枚举。
- **level**（integer, default 1）：工厂等级。仅对 factory 有意义，其余建筑类型固定为 1。

**选择在 plot_buildings 上加列而非新建 factory_details 表的理由**：
- 避免每次读取工厂信息时的额外 JOIN
- building 实体已经有 `ensureFactory()` 等类型断言方法，加字段是自然扩展
- subtype 和 level 是建筑固有属性，不是可独立变化的关联数据
- 对非 factory 类型的建筑，这两个字段只是 null/1，没有副作用

### 2.2 新增 factory_unlocked_recipes 表

记录每座工厂已解锁的配方。

- **building_id**（bigint, FK → plot_buildings, CASCADE DELETE）
- **recipe_id**（varchar(50)）：配方标识
- **unlocked_at**（timestamp）：解锁时间

主键：(building_id, recipe_id) 复合主键

索引：building_id（按工厂查询全部已解锁配方）

**设计要点**：
- 解锁记录跟随建筑生命周期——建筑被拆除时，解锁记录级联删除
- 不记录解锁费用（费用信息在配方元数据中，解锁记录只需要表达"是否已解锁"）
- 通过交易流水表追溯解锁扣费明细

### 2.3 配方元数据扩展

在现有配方定义的静态数据结构上新增以下字段：

- **factorySubtypes**：该配方可被哪些工厂类型使用，数组形式。特殊值 `"*"` 表示所有类型通用（用于 buy_water）
- **unlockCost**：解锁该配方所需金币
- **requiredLevel**：使用该配方所需的最低工厂等级

这些元数据仍然是静态配置，定义在 recipe-catalog 中，不入数据库。

---

## 三、模块设计

### 3.1 recipe 模块

**职责变更**：从「提供全量配方列表」变为「提供带元数据的配方列表 + 按工厂类型/等级筛选」。

**设计思路**：

配方目录（recipe-catalog）作为静态数据源，新增元数据字段。提供以下查询能力：

- 按工厂子类型筛选可用配方：给定 subtype，返回该类型可用的所有配方（包括通用配方）
- 按等级过滤：给定 subtype + level，返回该工厂当前等级能解锁的配方
- 单个配方查询时携带完整元数据（含解锁费用、等级要求）

**通用配方的处理**：buy_water 的 factorySubtypes 设为 `"*"`，筛选逻辑中对此特殊处理——任何工厂类型查询时都包含通用配方。

**新增配方**：buy_water_bulk（高效产水），factorySubtypes 仅包含 waterworks，产出效率高于 buy_water。

### 3.2 building 模块

**职责变更**：建筑实体需要感知 subtype 和 level。

**设计思路**：

Building 实体扩展：
- 新增 subtype 和 level 属性
- `Building.construct()` 方法新增可选的 subtype 参数，当 type 为 factory 时必填
- 新增 `upgrade()` 方法：level + 1，内部校验不超过等级上限
- `ensureFactory()` 断言方法可以顺便返回 subtype，方便调用方使用

建造流程变更：
- `BuildBuildingCommand` 新增可选字段 `factorySubtype`
- 校验逻辑：当 buildingType 为 factory 时，factorySubtype 必须提供且为有效枚举值；非 factory 类型则忽略该字段
- 建造费用查询支持按工厂子类型区分（building-cost-catalog 的 key 从 buildingType 变为 buildingType + subtype 组合）

### 3.3 factory 模块

**职责变更**：从「管理生产任务」扩展为「管理配方解锁 + 工厂升级 + 生产任务」。

**新增用例一：解锁配方 (unlock-recipe)**

流程：
1. 根据 buildingId 获取建筑，校验所有权，确认是工厂
2. 读取建筑的 subtype 和 level
3. 根据 recipeId 获取配方元数据
4. 校验三项条件：
   - 配方的 factorySubtypes 包含该工厂的 subtype（或为通用 `"*"`）
   - 配方的 requiredLevel ≤ 工厂当前 level
   - 用户金币 ≥ 配方的 unlockCost
5. 检查是否已解锁（幂等：已解锁则直接返回成功，不重复扣款）
6. 事务内：扣款 → 写入 factory_unlocked_recipes → 记录交易流水

**新增用例二：升级工厂 (upgrade-factory)**

流程：
1. 根据 buildingId 获取建筑，校验所有权，确认是工厂
2. 计算升级费用（按当前等级查表）
3. 校验：当前等级 < 等级上限，金币充足
4. 事务内：扣款 → 更新 building level → 记录交易流水

**现有用例改造：启动生产 (start-factory-production)**

在现有校验步骤「确认是工厂 → 检查无进行中任务」之后，新增一步：
- 查询 factory_unlocked_recipes 表，确认该 buildingId + recipeId 存在记录
- 不存在则返回错误：「该工厂尚未解锁此配方」

**现有用例改造：查询配方 (recipes)**

从返回全量配方，改为：
- 若请求携带 buildingId：返回该工厂子类型的可用配方列表，每个配方标注 `unlocked: boolean`
- 若无 buildingId（兼容旧接口）：返回全量配方（供前端展示总览）

**建造后的默认解锁**

工厂建造成功后，由 factory 模块负责自动解锁该子类型的默认配方（1-2 个基础采购配方）。具体实现方式：在 building 模块的建造用例完成后，调用 factory 模块的「批量解锁配方」方法，免费写入默认配方的解锁记录（不扣费）。

**默认配方的定义**：每个工厂子类型在配方元数据中标记 `defaultUnlocked: true` 的配方即为建成自动解锁的配方。

---

## 四、配方分配映射

### 4.1 工厂类型与配方归属总表

以下为 10 种工厂类型对 55 条配方（54 现有 + 1 新增）的完整分配方案。

#### 采矿场 (mine)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_iron_ore, buy_copper_ore, buy_coal, buy_stone | 基础矿产采购 |
| 1 | buy_sand, buy_clay | 沙土采集 |
| 1 | buy_water ★ | 通用配方 |
| 2 | kiln_brick, calcine_lime, smelt_glass | 土石加工 |
| 3 | fire_pottery, fire_porcelain, mix_plaster | 高级土石加工 |

#### 伐木场 (lumber_mill)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_wood | 木材采购 |
| 1 | buy_water ★ | 通用配方 |
| 1 | saw_wood_plank | 基础木材加工 |
| 2 | burn_charcoal | 木炭烧制 |

#### 纺织厂 (textile_mill)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_cotton, buy_flax | 纤维原料采购 |
| 1 | buy_water ★ | 通用配方 |
| 1 | spin_thread, twist_rope | 基础纺织 |
| 2 | woven_cloth, weave_linen | 织布 |
| 3 | weave_fine_cloth | 高级织造 |

#### 牧场 (ranch)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_raw_hide, buy_animal_fat | 畜牧原料采购 |
| 1 | buy_water ★ | 通用配方 |
| 2 | tan_leather, render_tallow | 皮革/油脂加工 |
| 2 | make_candle | 蜡烛制作 |
| 3 | craft_saddle | 马鞍制作 |

#### 炼金坊 (apothecary)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_herbs | 草药采购 |
| 1 | buy_water ★ | 通用配方 |
| 2 | extract_dye, grind_ink | 染料/墨水加工 |
| 3 | brew_medicine | 药品调制 |

#### 造水厂 (waterworks)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_water ★ | 通用配方 |
| 1 | buy_water_bulk（新增） | 高效产水独占配方 |

#### 冶炼厂 (smelter)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_water ★ | 通用配方 |
| 1 | smelt_iron_ingot, smelt_copper_ingot | 基础冶炼 |
| 2 | forge_nails, forge_steel | 锻造 |
| 3 | cast_bronze | 铸造青铜 |

#### 木工坊 (carpentry)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_water ★ | 通用配方 |
| 1 | saw_wood_plank | 木板加工（与伐木场共享） |
| 2 | assemble_barrel, assemble_window | 木工组装 |
| 3 | assemble_furniture | 家具组装 |

#### 造纸厂 (paper_mill)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_water ★ | 通用配方 |
| 1 | pulp_paper | 造纸 |
| 2 | grind_ink | 墨水研制（与炼金坊共享） |
| 3 | bind_books | 装订书籍 |

#### 组装厂 (assembler)

| 等级 | 配方 | 说明 |
|-----|------|------|
| 1 | buy_water ★ | 通用配方 |
| 2 | forge_tools, assemble_lantern, assemble_compass, craft_backpack | 中级组装 |
| 2 | carve_sculpture, build_reinforced_wall | 建筑/文化组装 |
| 3 | assemble_machine_parts, forge_armor | 高级组装 |
| 3 | assemble_telescope, assemble_clock | 精密组装 |
| 3 | craft_land_reclamation_badge | 终极配方 |

### 4.2 映射设计原则

- **原材料采购配方绑定原料产出型工厂**：mine、lumber_mill、textile_mill、ranch、apothecary 各自独占对应原料的采购配方
- **加工配方跟随产业链**：冶炼归冶炼厂，纺织归纺织厂，皮革归牧场，合理的少量重叠（如 saw_wood_plank 同时归伐木场和木工坊，grind_ink 同时归炼金坊和造纸厂）
- **组装配方集中在组装厂和专业工坊**：高级组装主要归组装厂，少数贴合产业链的成品归专业工坊（如 craft_saddle 归牧场，bind_books 归造纸厂）
- **水为通用资源**：buy_water 所有工厂可用，buy_water_bulk 造水厂独占

### 4.3 稀缺性验证

以终极配方 `craft_land_reclamation_badge` 为例，其输入材料需要以下工厂类型的产出：

| 输入材料 | 来源工厂 |
|---------|---------|
| steel, bronze, iron_ingot, copper_ingot, nails | 冶炼厂 |
| wood_plank | 伐木场 / 木工坊 |
| brick, glass, plaster | 采矿场 |
| leather | 牧场 |
| fine_cloth | 纺织厂 |
| porcelain | 采矿场 |
| rope | 纺织厂 |
| tools, machine_parts | 组装厂 |
| reinforced_wall, furniture, sculpture, books | 组装厂 / 木工坊 / 造纸厂 |

生产一枚徽章至少需要 **6 种不同类型工厂** 的产出参与，充分验证了稀缺性和交易必要性。

---

## 五、数值设计

### 5.1 工厂等级

- **等级上限**：3 级
- 选择 3 级而非 5 级的理由：10 种工厂类型已经提供了足够的水平复杂度，等级维度保持简单即可；3 级对应「入门→进阶→精通」的清晰心智模型

### 5.2 升级费用

| 升级路径 | 费用 |
|---------|------|
| 1 → 2 | 1,000 金币 |
| 2 → 3 | 3,000 金币 |

递增比例约 3 倍。初始资金 10,000 金币可以支撑 1-2 次升级，但不能全部用于升级（还需要留钱解锁配方和生产），形成资源分配的决策点。

### 5.3 配方解锁费用

按配方类别和等级要求分档：

| 配方层级 | 解锁费用 | 说明 |
|---------|---------|------|
| 等级 1 采购配方 | 50 金币 | 入门门槛低 |
| 等级 1 加工配方 | 100 金币 | 基础加工 |
| 等级 2 加工配方 | 200 金币 | 进阶加工 |
| 等级 2 组装配方 | 300 金币 | 中级成品 |
| 等级 3 加工配方 | 400 金币 | 高级加工 |
| 等级 3 组装配方 | 500 金币 | 高级成品 |
| 终极配方 | 2,000 金币 | 徽章配方 |
| 通用配方 (buy_water) | 30 金币 | 人人可用，费用最低 |

**新手体验验算**：新玩家初始 10,000 金币，建一座工厂（约 800 金币），自动获得 1-2 个默认配方，再手动解锁 1-2 个基础配方（50-100 金币/个），剩余约 9,000 金币足够生产和探索。

### 5.4 各类型工厂建造费用

| 工厂类型 | 建造费用 | 理由 |
|---------|---------|------|
| 采矿场 (mine) | 800 | 基础采集型 |
| 伐木场 (lumber_mill) | 800 | 基础采集型 |
| 纺织厂 (textile_mill) | 900 | 采集 + 加工复合型 |
| 牧场 (ranch) | 900 | 采集 + 加工复合型 |
| 炼金坊 (apothecary) | 900 | 采集 + 加工复合型 |
| 造水厂 (waterworks) | 600 | 单一功能，配方最少 |
| 冶炼厂 (smelter) | 1,000 | 核心加工型 |
| 木工坊 (carpentry) | 1,000 | 加工 + 组装复合型 |
| 造纸厂 (paper_mill) | 1,000 | 加工 + 组装复合型 |
| 组装厂 (assembler) | 1,200 | 终端高级组装，配方价值最高 |

### 5.5 新增配方：高效产水

| 字段 | 值 |
|-----|-----|
| id | buy_water_bulk |
| name | 批量采水 |
| category | procurement |
| durationSeconds | 10 |
| inputs | money × 60 |
| outputs | water × 12 |
| factorySubtypes | waterworks |
| requiredLevel | 1 |
| unlockCost | 50 |

对比普通 buy_water（¥40 → 6 水），buy_water_bulk 单位成本 ¥5/水 vs ¥6.67/水，效率提升约 33%。

### 5.6 默认解锁配方

每种工厂建成后自动免费解锁的配方：

| 工厂类型 | 默认解锁配方 |
|---------|------------|
| mine | buy_iron_ore, buy_water |
| lumber_mill | buy_wood, buy_water |
| textile_mill | buy_cotton, buy_water |
| ranch | buy_raw_hide, buy_water |
| apothecary | buy_herbs, buy_water |
| waterworks | buy_water, buy_water_bulk |
| smelter | smelt_iron_ingot, buy_water |
| carpentry | saw_wood_plank, buy_water |
| paper_mill | pulp_paper, buy_water |
| assembler | buy_water |

原则：每个工厂至少默认解锁 buy_water + 该类型最基础的 1 个配方（组装厂例外，因其配方都需要等级 2+，仅默认解锁 buy_water）。

---

## 六、关键设计决策

### 6.1 配方元数据放在静态代码还是数据库？

**决策：静态代码（recipe-catalog）**

理由：
- 配方元数据（类型归属、费用、等级要求）属于游戏设计参数，变更频率低，和配方定义本身一样适合放在代码中
- 避免引入「配方管理后台」的额外复杂度
- 通过修改代码 + 部署即可调整数值，和当前配方管理方式一致
- 数据库中只存储玩家行为产生的数据（解锁记录），不存储设计参数

### 6.2 解锁记录的幂等性

**决策：已解锁配方再次请求解锁时，直接返回成功，不重复扣款**

理由：
- 防止网络重试或前端重复点击导致的重复扣费
- 复合主键 (building_id, recipe_id) 天然保证唯一性
- 前端可以简单地在解锁按钮点击后刷新状态，无需担心竞态

### 6.3 升级时是否要求工厂空闲（无进行中任务）？

**决策：不要求**

理由：
- 升级是元数据变更（level 字段 +1），不影响正在进行的生产任务
- 要求空闲会引入不必要的等待，降低体验
- 升级后新解锁的配方在当前任务完成前就可以开始解锁（但不能立即使用生产，因为工厂同时只能有一个进行中任务）

### 6.4 工厂子类型枚举的维护位置

**决策：在 building 模块中定义 FactorySubtype 枚举，recipe 模块引用该枚举**

理由：
- subtype 是建筑的属性，应由 building 模块拥有
- recipe 模块通过导入枚举来建立类型安全的配方归属映射
- 避免循环依赖：building 定义枚举 → recipe 引用枚举 → factory 同时使用两者

### 6.5 清档策略的实施

**决策：通过数据库迁移脚本清除旧数据**

实施方式：
- 新增 migration：为 plot_buildings 表添加 subtype 和 level 字段
- 新增 migration：创建 factory_unlocked_recipes 表
- 新增 migration：清除所有现有 factory 类型的建筑记录（关联的生产任务通过 CASCADE 自动清除）
- 保留非 factory 类型的建筑（residential、shop、purchasing_station）不受影响
