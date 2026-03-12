# Domain Model (DDD)

## Bounded Context

- `user`：用户身份、用户名规则、认证主体信息。
- `plot`：地块坐标、所有权、状态流转与购买行为。
- `building`：建筑类型、等级、建筑位置与建造规则。
- `shared-kernel`：跨上下文共享的基础领域能力（如 `DomainError`）。

## Ubiquitous Language

- 用户（User）：系统中的玩家身份。
- 地块（Plot）：地图上的可购买资源格。
- 建筑（Building）：地块上的可升级实体。

## Aggregates and Entities

- `User`（实体）
  - 关键属性：`id`、`username`、`passwordHash`
- `Plot`（聚合根）
  - 关键属性：`id`、`coordinate`、`ownerUserId`、`status`、`price`
  - 关键行为：`purchaseBy`、`lock`、`unlock`
- `Building`（聚合根）
  - 关键属性：`id`、`plotId`、`ownerUserId`、`type`、`level`、`position`
  - 关键行为：`upgrade`、`transferOwner`

## Value Objects

- `Username`（`user`）：用户名规范化和长度约束（3-32）。
- `PlotCoordinate`（`plot`）：地块坐标，要求整数。
- `BuildingType`（`building`）：建筑类型白名单（house/factory/warehouse）。

## Domain Services / Policies

- `BuildingPolicy`
  - `createOnOwnedPlot`：校验地块所有权 + 位置冲突后创建建筑。

## Repository Contracts

- `user/domain/repositories/UserRepository`
- `plot/domain/repositories/PlotRepository`
- `building/domain/repositories/BuildingRepository`

以上接口位于各自 domain 层，仅定义行为，不关心 drizzle/SQL 细节。
