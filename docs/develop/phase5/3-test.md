# Phase 5 测试规格索引

## 测试规格文件

| 规格文件 | 对应源码 | 说明 |
|---------|---------|------|
| [test-user-stamina.md](./test/test-user-stamina.md) | `person/domain/entities/user.ts` | consumeStamina、recoverStaminaByAmount、常量 |
| [test-factory-stamina.md](./test/test-factory-stamina.md) | `factory/application/start-factory-production-use-case.ts` | 生产前体力校验与扣除 |
| [test-rest-job.md](./test/test-rest-job.md) | `residential/domain/entities/rest-job.ts` | RestJob 实体方法 |
| [test-start-rest.md](./test/test-start-rest.md) | `residential/application/start-rest-use-case.ts` | 发起休息（自己/别人住宅） |
| [test-collect-rest.md](./test/test-collect-rest.md) | `residential/application/collect-rest-use-case.ts` | 收取休息、恢复体力 |
| [test-set-rest-price.md](./test/test-set-rest-price.md) | `residential/application/set-rest-price-use-case.ts` | 住宅定价 |
| [test-list-rest-jobs.md](./test/test-list-rest-jobs.md) | `residential/application/list-rest-jobs-use-case.ts` | 查询休息任务列表 |

## 验收标准

- [ ] 所有测试文件通过 `vitest run`
- [ ] `tsc --noEmit` 零错误
- [ ] 体力不足时工厂生产被拒绝
- [ ] 在自己住宅休息：500 金币 → Adam，300s 后收取恢复满体力
- [ ] 在别人住宅休息：主人定价，90% 归主人 / 10% 归 Adam
- [ ] 住宅主人可设定/关闭对外休息价格
- [ ] 体力恢复不超过上限（截断至 1000）
- [ ] 每栋住宅同时只能有 1 个休息任务
