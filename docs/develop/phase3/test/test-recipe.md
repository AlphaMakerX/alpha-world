# 测试规格：recipe 模块

## 配方数据完整性

- 当调用 `listRecipes()` 时，应返回 55 条配方（54 现有 + 1 新增 buy_water_bulk）
- 当遍历所有配方时，每条配方应包含 `factorySubtypes`、`unlockCost`、`requiredLevel`、`defaultUnlocked` 字段
- 当遍历所有配方时，每条配方的 `unlockCost` 应大于 0
- 当遍历所有配方时，每条配方的 `requiredLevel` 应为 1、2 或 3

## 新增配方 buy_water_bulk

- 当调用 `getRecipeById("buy_water_bulk")` 时，应返回高效产水配方
- 当查看 buy_water_bulk 配方时，其 category 应为 "procurement"
- 当查看 buy_water_bulk 配方时，其 inputs 应为 money × 60
- 当查看 buy_water_bulk 配方时，其 outputs 应为 water × 12
- 当查看 buy_water_bulk 配方时，其 factorySubtypes 应仅包含 "waterworks"
- 当查看 buy_water_bulk 配方时，其 durationSeconds 应为 10

## 通用配方标记

- 当查看 buy_water 配方时，其 factorySubtypes 应为 `"*"`（通用）
- 当查看非 buy_water 的采购配方时，其 factorySubtypes 不应为 `"*"`

## 按工厂子类型筛选

- 当调用 `listRecipesByFactorySubtype("mine")` 时，应包含 buy_iron_ore、buy_copper_ore、buy_coal、buy_stone、buy_sand、buy_clay
- 当调用 `listRecipesByFactorySubtype("mine")` 时，应包含通用配方 buy_water
- 当调用 `listRecipesByFactorySubtype("mine")` 时，不应包含 buy_wood（伐木场独占）
- 当调用 `listRecipesByFactorySubtype("mine")` 时，不应包含 buy_cotton（纺织厂独占）
- 当调用 `listRecipesByFactorySubtype("waterworks")` 时，应仅包含 buy_water 和 buy_water_bulk
- 当调用 `listRecipesByFactorySubtype("lumber_mill")` 时，应包含 buy_wood、saw_wood_plank、burn_charcoal、buy_water
- 当调用 `listRecipesByFactorySubtype("smelter")` 时，应包含 smelt_iron_ingot、smelt_copper_ingot、forge_nails、forge_steel、cast_bronze、buy_water
- 当调用 `listRecipesByFactorySubtype("assembler")` 时，不应包含任何 procurement 类别的采购配方（buy_water 除外）
- 当调用 `listRecipesByFactorySubtype("textile_mill")` 时，应包含 buy_cotton、buy_flax、spin_thread、twist_rope、woven_cloth、weave_linen、weave_fine_cloth、buy_water
- 当调用 `listRecipesByFactorySubtype("ranch")` 时，应包含 buy_raw_hide、buy_animal_fat、tan_leather、render_tallow、make_candle、craft_saddle、buy_water
- 当调用 `listRecipesByFactorySubtype("apothecary")` 时，应包含 buy_herbs、extract_dye、grind_ink、brew_medicine、buy_water
- 当调用 `listRecipesByFactorySubtype("carpentry")` 时，应包含 saw_wood_plank、assemble_barrel、assemble_window、assemble_furniture、buy_water
- 当调用 `listRecipesByFactorySubtype("paper_mill")` 时，应包含 pulp_paper、grind_ink、bind_books、buy_water

## 按工厂子类型 + 等级筛选

- 当调用 `listRecipesByFactorySubtypeAndLevel("mine", 1)` 时，应仅返回 requiredLevel ≤ 1 的 mine 配方
- 当调用 `listRecipesByFactorySubtypeAndLevel("mine", 2)` 时，应返回 requiredLevel ≤ 2 的 mine 配方（包含 kiln_brick、calcine_lime、smelt_glass）
- 当调用 `listRecipesByFactorySubtypeAndLevel("mine", 3)` 时，应返回全部 mine 配方（包含 fire_pottery、fire_porcelain、mix_plaster）
- 当调用 `listRecipesByFactorySubtypeAndLevel("mine", 1)` 时，不应包含 kiln_brick（需要等级 2）
- 当调用 `listRecipesByFactorySubtypeAndLevel("smelter", 1)` 时，应包含 smelt_iron_ingot、smelt_copper_ingot、buy_water，不应包含 forge_steel
- 当调用 `listRecipesByFactorySubtypeAndLevel("assembler", 1)` 时，应仅包含 buy_water（该类型所有其他配方都需要等级 2+）

## 默认解锁配方查询

- 当调用 `listDefaultRecipes("mine")` 时，应返回 buy_iron_ore 和 buy_water
- 当调用 `listDefaultRecipes("lumber_mill")` 时，应返回 buy_wood 和 buy_water
- 当调用 `listDefaultRecipes("textile_mill")` 时，应返回 buy_cotton 和 buy_water
- 当调用 `listDefaultRecipes("ranch")` 时，应返回 buy_raw_hide 和 buy_water
- 当调用 `listDefaultRecipes("apothecary")` 时，应返回 buy_herbs 和 buy_water
- 当调用 `listDefaultRecipes("waterworks")` 时，应返回 buy_water 和 buy_water_bulk
- 当调用 `listDefaultRecipes("smelter")` 时，应返回 smelt_iron_ingot 和 buy_water
- 当调用 `listDefaultRecipes("carpentry")` 时，应返回 saw_wood_plank 和 buy_water
- 当调用 `listDefaultRecipes("paper_mill")` 时，应返回 pulp_paper 和 buy_water
- 当调用 `listDefaultRecipes("assembler")` 时，应仅返回 buy_water

## 配方解锁费用

- 当查看 buy_water 配方时，其 unlockCost 应为 30
- 当查看 buy_iron_ore 配方时，其 unlockCost 应为 50（等级 1 采购配方）
- 当查看 smelt_iron_ingot 配方时，其 unlockCost 应为 100（等级 1 加工配方）
- 当查看 kiln_brick 配方时，其 unlockCost 应为 200（等级 2 加工配方）
- 当查看 forge_tools 配方时，其 unlockCost 应为 300（等级 2 组装配方）
- 当查看 fire_porcelain 配方时，其 unlockCost 应为 400（等级 3 加工配方）
- 当查看 assemble_telescope 配方时，其 unlockCost 应为 500（等级 3 组装配方）
- 当查看 craft_land_reclamation_badge 配方时，其 unlockCost 应为 2000（终极配方）

## 共享配方验证

- 当查看 saw_wood_plank 配方时，其 factorySubtypes 应同时包含 "lumber_mill" 和 "carpentry"
- 当查看 grind_ink 配方时，其 factorySubtypes 应同时包含 "apothecary" 和 "paper_mill"
