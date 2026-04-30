# Phase 5：完善体力系统

让体力成为有意义的游戏资源，同时让住宅建筑拥有实际用途。

## 现状

体力系统**半成品**：DB 字段（stamina_current/max/updated_at）、User 实体（recoverStamina 方法）、API 返回体力值均已就位，但**没有任何活动消耗体力**，前端也不展示。住宅建筑仅是一个空壳类型。

## 业务规则

详见 [1-design.md](./1-design.md)。核心要点：

- **体力上限 1000**，自然恢复 10/小时（≈100 小时恢复满）
- **工厂生产消耗体力**：`时长 × 数量 × 0.1`，不足则拒绝
- **住宅休息**：500 金币 / 300 秒 / 恢复满，手动收取
- **他人住宅**：主人自由定价，系统抽成 10%

## 任务清单

### 后端

- [ ] User 实体新增 `consumeStamina(amount)` 和 `recoverStaminaByAmount(amount)` 方法 + 测试
- [ ] 改造 start-factory-production：生产前结算恢复 + 校验体力 + 扣除体力 + 测试
- [ ] 新建 residential_rest_jobs 表 schema
- [ ] 新建 RestJobRepository + 实现
- [ ] 新建 rest-catalog.ts（休息类型静态数据）
- [ ] 新建 start-rest-use-case + 测试
- [ ] 新建 collect-rest-use-case + 测试
- [ ] 新建 list-rest-jobs-use-case + 测试
- [ ] 新建 residential router（startRest / collectRest / restJobs）
- [ ] 住宅定价功能（设定/查询价格）
- [ ] 全量测试 + tsc 零错误

### 前端

- [ ] world-map-header 新增体力条组件（基于 staminaCurrent + updatedAt 前端插值）
- [ ] 生产面板显示体力消耗预览
- [ ] 住宅详情面板：发起休息 + 收取休息
- [ ] 住宅定价界面（主人设定价格）
