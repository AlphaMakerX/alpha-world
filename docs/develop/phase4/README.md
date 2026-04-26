# Phase 4：代码重构 — 可读性与解耦

> 规格与实现：[1-proposal.md](./1-proposal.md) · [2-design.md](./2-design.md) · `3-test.md`（不适用，纯重构以已有测试为回归保障） · [4-task.md](./4-task.md) · `5-conclusion.md`（待写）

Phase 3 引入工厂类型化、配方解锁、升级系统后，代码库的复杂度显著增长。本阶段在**不改变外部行为**的前提下，针对性地改善代码的可读性、可维护性和模块解耦度。

## 核心问题

1. **大文件难以维护**：`recipe-catalog.ts`（982 行）将 55 条配方定义和查询逻辑混在一个文件中，每次修改配方都要在近千行代码中定位。
2. **跨模块副作用**：`build-building-use-case` 直接调用 factory 模块的 `autoUnlockDefaultRecipes`，building 模块不应知道 factory 的解锁逻辑。
3. **重复的事务模式**：解锁配方、升级工厂、启动生产、建造建筑四个用例都有「校验 → 扣款 → 转账系统账户 → 记录流水」的相同模式，各自独立实现。
4. **臃肿的依赖注入**：`start-factory-production-use-case` 注入 8 个依赖，composition root 在多个 wrapper 函数中重复列出相同依赖。
5. **系统初始化的 switch 膨胀**：`initialize-system-use-case.ts`（318 行）中 119 行是重复结构的 switch case。

## 改动范围

| 改动项 | 影响模块 | 风险等级 |
|-------|---------|---------|
| 拆分配方目录 | recipe | 低 — 纯数据重组织 |
| 消除 building → factory 耦合 | building, factory | 中 — 涉及调用链变更 |
| 提取付款服务 | factory, building (shared-kernel) | 中 — 多用例统一收口 |
| 简化 composition root | factory | 低 — 内部重构 |
| 重构系统初始化 | system-initialization | 低 — 内部重构 |
| 拆分客户端组件 | client/factory | 低 — 纯 UI 重构 |

## 原则

- **行为不变**：全部 186 项现有测试必须持续通过，不新增功能。
- **小步提交**：每个重构点独立提交，便于 review 和回滚。
- **先测试后重构**：对测试覆盖不足的区域，先补充测试再动代码。
