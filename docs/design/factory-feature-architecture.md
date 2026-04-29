# Factory Feature 架构

## 分层

```
router (tRPC, 鉴权)
  → composition (zod 校验, 依赖装配)
    → application (业务校验, 事务编排)
      → domain (实体行为, 仓储接口)
        → infrastructure (Drizzle 实现)
```

## 依赖关系

- factory → building + plot（建筑合法性、地块归属校验）
- factory → inventory（材料消耗、产物入库）
- factory → person（资金流转）
- 通过 `transact` 保证事务原子性

## 用例

| 用例 | 说明 |
|------|------|
| list-factory-recipes | 按工厂 subtype+level 筛选配方，标注解锁状态 |
| list-factory-orders | 校验归属，自动结算已完成任务，返回 focusOrder + historyOrders |
| start-factory-production | 校验建筑/配方/解锁/所有权/库存/余额 → 事务扣料扣钱创建任务 |
| unlock-recipe | 校验类型匹配+等级+金币 → 扣款写入解锁记录 |
| upgrade-factory | 校验未达上限+金币 → 扣款更新 level |
