# 测试规格：User 实体体力方法

对应源码：`src/server/features/person/domain/entities/user.ts`

## consumeStamina(amount)

- 当体力充足（500）且消耗 60 时，应扣除体力至 440，并更新 staminaUpdatedAt
- 当体力恰好等于消耗量时，应扣除至 0
- 当体力不足（30）且消耗 60 时，应抛出 DomainError「体力不足」
- 当消耗量为 0 时，应不改变体力值
- 当消耗量为负数时，应抛出 DomainError
- 当消耗量为小数（0.5）时，应正确扣除

## recoverStaminaByAmount(amount)

- 当当前体力 200、恢复 300 时，应增至 500
- 当当前体力 800、恢复 1000 时，应截断至上限 1000（staminaMax）
- 当当前体力已满（1000）时，应保持 1000 不变
- 当恢复量为 0 时，应不改变体力值
- 当恢复量为负数时，应抛出 DomainError
- 当恢复后应更新 staminaUpdatedAt

## 常量变更验证

- 当新玩家注册时，初始体力应为 1000（PLAYER_MAX_STAMINA）
- 当新玩家注册时，体力上限应为 1000
- PLAYER_STAMINA_RECOVERY_PER_SECOND 应等于 10/3600
- STAMINA_COST_PER_SECOND 应等于 0.1
