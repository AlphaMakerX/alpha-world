# 测试规格：factory 模块

## UnlockedRecipeRepository

- 当调用 `save(buildingId, recipeId)` 后，`isUnlocked(buildingId, recipeId)` 应返回 true
- 当未调用 save 时，`isUnlocked(buildingId, recipeId)` 应返回 false
- 当调用 `findByBuildingId(buildingId)` 时，应返回该工厂全部已解锁配方的 recipeId 列表
- 当工厂无任何解锁记录时，`findByBuildingId(buildingId)` 应返回空数组
- 当重复 `save(buildingId, recipeId)` 同一组合时，不应报错（幂等，upsert）
- 当调用 `saveBatch(buildingId, ["buy_iron_ore", "buy_water"])` 时，两条记录都应写入
- 当调用 `saveBatch(buildingId, [])` 传入空数组时，不应报错
- 当 building 被删除（CASCADE）时，其关联的解锁记录应被自动删除

## 解锁配方用例 — 正常流程

- 当工厂 subtype=mine、level=1，解锁 buy_iron_ore（类型匹配、等级达标）且金币充足时，应返回 ok 并扣款 50 金币
- 当工厂 subtype=mine、level=1，解锁 buy_water（通用配方）且金币充足时，应返回 ok 并扣款 30 金币
- 当解锁成功时，应调用 transactionLedgerRepository.record 记录交易流水
- 当解锁成功时，金币应转入系统账户（Adam）

## 解锁配方用例 — 幂等

- 当配方已经解锁，再次请求解锁同一配方时，应返回成功
- 当配方已经解锁，再次请求解锁时，不应扣款
- 当配方已经解锁，再次请求解锁时，不应记录交易流水

## 解锁配方用例 — 类型不匹配

- 当 mine 工厂尝试解锁 buy_wood（lumber_mill 独占）时，应返回错误「该工厂类型无法使用此配方」
- 当 smelter 工厂尝试解锁 buy_cotton（textile_mill 独占）时，应返回错误「该工厂类型无法使用此配方」
- 当 lumber_mill 工厂尝试解锁 buy_water_bulk（waterworks 独占）时，应返回错误

## 解锁配方用例 — 等级不足

- 当 mine 工厂 level=1 尝试解锁 kiln_brick（需要 level 2）时，应返回错误「工厂等级不足」
- 当 assembler 工厂 level=1 尝试解锁 forge_tools（需要 level 2）时，应返回错误「工厂等级不足」
- 当 mine 工厂 level=2 解锁 kiln_brick（需要 level 2）时，应成功

## 解锁配方用例 — 金币不足

- 当用户金币余额不足以支付解锁费用时，应返回余额不足错误
- 当金币不足时，不应写入解锁记录

## 解锁配方用例 — 异常

- 当 recipeId 不存在时，应返回「配方不存在」错误
- 当 buildingId 不存在时，应返回「建筑不存在」错误
- 当建筑类型不是工厂（如 shop）时，应返回「当前建筑不是工厂」错误
- 当操作者不是地块拥有者时，应返回「只能操作自己地块上的工厂」错误

---

## 升级工厂用例 — 正常流程

- 当 factory 建筑 level=1，金币充足时，升级应返回 ok，扣款 1000，building.level 变为 2
- 当 factory 建筑 level=2，金币充足时，升级应返回 ok，扣款 3000，building.level 变为 3
- 当升级成功时，应调用 transactionLedgerRepository.record 记录交易流水
- 当升级成功时，金币应转入系统账户（Adam）
- 当升级成功时，应调用 buildingRepository.save 保存更新后的 building

## 升级工厂用例 — 异常

- 当 factory 建筑 level=3 尝试升级时，应返回「已达最高等级」错误
- 当用户金币不足以支付升级费用时，应返回余额不足错误
- 当建筑类型不是工厂时，应返回错误
- 当 buildingId 不存在时，应返回「建筑不存在」错误
- 当操作者不是地块拥有者时，应返回错误

---

## 启动生产用例 — 解锁校验（新增）

- 当工厂已解锁目标配方时，生产应正常启动（走完原有全部流程）
- 当工厂未解锁目标配方时，应返回错误「该工厂尚未解锁此配方」
- 当工厂未解锁配方时，不应扣除任何金币或材料

## 启动生产用例 — 原有校验保持

- 当建筑不存在时，应返回错误
- 当配方不存在时，应返回错误
- 当工厂已有进行中任务时，应返回错误
- 当地块不属于当前用户时，应返回错误
- 当建筑不是工厂类型时，应返回错误
- 当余额不足时，应返回错误
- 当材料不足时，应返回错误

---

## 查询工厂配方用例

- 当传入 buildingId（mine 工厂，level=2）时，应返回 mine 类型 requiredLevel≤2 的配方列表
- 当传入 buildingId 时，返回的每条配方应包含 `unlocked: boolean` 字段
- 当工厂已解锁 buy_iron_ore 时，该配方的 unlocked 应为 true
- 当工厂未解锁 kiln_brick 时，该配方的 unlocked 应为 false
- 当传入 buildingId 时，返回列表应包含通用配方 buy_water
- 当传入 mine 工厂的 buildingId 时，不应返回 buy_wood（非该类型配方）
- 当不传 buildingId 时，应返回全量 55 条配方（兼容旧接口）
- 当建筑不存在时，应返回错误
- 当操作者不是地块拥有者时，应返回错误

---

## 建造后默认解锁

- 当调用 `autoUnlockDefaultRecipes(buildingId, "mine")` 时，应写入 buy_iron_ore 和 buy_water 的解锁记录
- 当调用 `autoUnlockDefaultRecipes(buildingId, "waterworks")` 时，应写入 buy_water 和 buy_water_bulk 的解锁记录
- 当调用 `autoUnlockDefaultRecipes(buildingId, "assembler")` 时，应仅写入 buy_water 的解锁记录
- 当调用 `autoUnlockDefaultRecipes(buildingId, "lumber_mill")` 时，应写入 buy_wood 和 buy_water 的解锁记录
- 当调用 `autoUnlockDefaultRecipes(buildingId, "smelter")` 时，应写入 smelt_iron_ingot 和 buy_water 的解锁记录

## 建造后默认解锁 — 集成到建造流程

- 当建造 factory 类型建筑（subtype=mine）成功后，该工厂应自动拥有 buy_iron_ore 和 buy_water 的解锁记录
- 当建造 residential 类型建筑时，不应触发任何默认解锁逻辑

---

## 升级费用目录

- 当查询 level 1→2 的升级费用时，应返回 1000
- 当查询 level 2→3 的升级费用时，应返回 3000
- 当查询 level 3 的升级费用时（已达上限），应返回 null 或抛出错误
