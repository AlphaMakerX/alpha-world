# Phase 4：代码重构（待实施）

不改变外部行为，186 项测试持续通过。

## 重构项

### R1：拆分配方目录

`recipe-catalog.ts`（982 行）→ 拆为 `recipes/procurement.ts`、`processing.ts`、`assembly.ts`，主文件仅保留查询函数（≤100 行）。

### R2：消除 building ↔ factory 耦合

- 提取独立 Factory 实体 + FactoryRepository 到 factory 模块（共享 plot_buildings 表，不改 schema）
- Building 实体移除 `ensureFactory()`/`upgrade()`
- 建造用例改用 `afterBuildHook` 回调，composition 层注入 factory 解锁逻辑
- factory-subtype.ts 迁移到 factory 模块
- 所有 factory use case 改用 FactoryRepository

### R3：提取付款服务

4 个用例的「校验余额→扣款→转入 Adam→记流水」统一为 `shared-kernel/payment-service.ts`。

### R4：简化 Factory Composition Root

顶层 `sharedDeps` 对象一次性构建，wrapper 共享引用。

### R5：重构系统初始化

switch（119 行模板）→ Step 注册表 + for 循环，~318 行降至 ~50 行。

### R6：客户端组件拆分（可选）

拆分 factory-section.tsx 和 recipe-detail.tsx。

## 执行顺序

R1 → R3 → R2 → R4 → R5 → R6

## 验收

- 测试全通过 + tsc 零错误
- recipe-catalog.ts ≤ 100 行
- build-building-use-case.ts 无 factory import
- 扣款逻辑只有一份实现
- initialize-system 无 switch
