# 测试规格：building 模块

## FactorySubtype 枚举

- 当访问 `FACTORY_SUBTYPES` 常量时，应包含全部 10 种类型：mine、lumber_mill、textile_mill、ranch、apothecary、waterworks、smelter、carpentry、paper_mill、assembler
- 当调用 `isValidFactorySubtype("mine")` 时，应返回 true
- 当调用 `isValidFactorySubtype("smelter")` 时，应返回 true
- 当调用 `isValidFactorySubtype("waterworks")` 时，应返回 true
- 当调用 `isValidFactorySubtype("invalid_type")` 时，应返回 false
- 当调用 `isValidFactorySubtype("")` 时，应返回 false
- 当访问 `MAX_FACTORY_LEVEL` 常量时，应为 3

## Building 实体 — 构造

- 当调用 `Building.construct({ type: "factory", subtype: "mine" })` 时，应创建 level=1、subtype="mine" 的建筑
- 当调用 `Building.construct({ type: "factory", subtype: "assembler" })` 时，应创建 level=1、subtype="assembler" 的建筑
- 当调用 `Building.construct({ type: "factory" })` 不传 subtype 时，应抛出错误
- 当调用 `Building.construct({ type: "factory", subtype: "invalid" })` 传入无效 subtype 时，应抛出错误
- 当调用 `Building.construct({ type: "residential" })` 不传 subtype 时，应正常创建，subtype 为 null
- 当调用 `Building.construct({ type: "shop" })` 不传 subtype 时，应正常创建，subtype 为 null
- 当调用 `Building.construct({ type: "residential", subtype: "mine" })` 时，应忽略 subtype（或抛出错误），非 factory 不应有 subtype

## Building 实体 — 升级

- 当 factory 建筑（level=1）调用 `upgrade()` 时，level 应变为 2
- 当 factory 建筑（level=2）调用 `upgrade()` 时，level 应变为 3
- 当 factory 建筑（level=3）调用 `upgrade()` 时，应抛出「已达最高等级」错误
- 当 residential 建筑调用 `upgrade()` 时，应抛出错误（非工厂不能升级）

## Building 实体 — ensureFactory

- 当 factory 建筑调用 `ensureFactory()` 时，应返回其 subtype 值（如 "mine"）
- 当 residential 建筑调用 `ensureFactory()` 时，应抛出「当前建筑不是工厂」错误
- 当 shop 建筑调用 `ensureFactory()` 时，应抛出「当前建筑不是工厂」错误

## Building 实体 — rehydrate

- 当调用 `Building.rehydrate({ type: "factory", subtype: "smelter", level: 2, ... })` 时，应正确恢复 subtype 和 level
- 当调用 `Building.rehydrate({ type: "residential", subtype: null, level: 1, ... })` 时，应正确恢复

## 建造费用目录

- 当调用 `getBuildingCost("factory", "mine")` 时，应返回 800
- 当调用 `getBuildingCost("factory", "lumber_mill")` 时，应返回 800
- 当调用 `getBuildingCost("factory", "textile_mill")` 时，应返回 900
- 当调用 `getBuildingCost("factory", "ranch")` 时，应返回 900
- 当调用 `getBuildingCost("factory", "apothecary")` 时，应返回 900
- 当调用 `getBuildingCost("factory", "waterworks")` 时，应返回 600
- 当调用 `getBuildingCost("factory", "smelter")` 时，应返回 1000
- 当调用 `getBuildingCost("factory", "carpentry")` 时，应返回 1000
- 当调用 `getBuildingCost("factory", "paper_mill")` 时，应返回 1000
- 当调用 `getBuildingCost("factory", "assembler")` 时，应返回 1200
- 当调用 `getBuildingCost("residential")` 时，应返回 500
- 当调用 `getBuildingCost("shop")` 时，应返回 600
- 当调用 `getBuildingCost("purchasing_station")` 时，应返回 700

## 建造建筑用例 — 工厂建造

- 当建造工厂传入 `factorySubtype: "mine"` 时，应成功返回包含 subtype="mine" 和 level=1 的 building
- 当建造工厂传入 `factorySubtype: "assembler"` 时，应扣款 1200（组装厂费用）
- 当建造工厂不传 `factorySubtype` 时，应返回错误
- 当建造工厂传入无效的 `factorySubtype: "invalid"` 时，应返回错误
- 当建造工厂时金币不足以支付该类型建造费用时，应返回余额不足错误

## 建造建筑用例 — 非工厂建造

- 当建造 residential 不传 factorySubtype 时，应正常成功
- 当建造 shop 不传 factorySubtype 时，应正常成功

## 建造建筑用例 — 原有校验保持

- 当地块不存在时，应返回地块不存在错误
- 当地块不属于当前用户时，应返回只能在自己地块建造错误
- 当地块已有建筑时，应返回该地块已有建筑错误

## Building Repository 持久化

- 当保存带 subtype="mine" 和 level=1 的 factory 建筑后，findById 应读取出正确的 subtype 和 level
- 当保存 residential 建筑（subtype=null）后，findById 应读取出 subtype 为 null、level 为 1
- 当保存建筑后修改 level 为 2 再次 save 时，findById 应读取到 level=2
- 当保存带各种 subtype 的 factory 建筑时，findByPlotId 也应返回正确的 subtype 和 level
