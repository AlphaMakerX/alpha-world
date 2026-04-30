# 测试规格：collect-rest-use-case

对应源码：`src/server/features/residential/application/collect-rest-use-case.ts`

## 正常流程

- 当休息任务已完成（now ≥ finishAt）时，应恢复体力并将 job 标记为 collected
- 当收取前应先结算自然恢复，再叠加休息恢复量
- 当恢复后体力超过上限时，应截断至 staminaMax（1000）
- 当体力为 0、自然恢复了 50、休息恢复 1000 时，最终应为 1000（截断）

## 校验

- 当 job 不存在时，应返回 NOT_FOUND
- 当调用者不是休息发起人（resterUserId 不匹配）时，应返回错误
- 当 job 尚未完成（now < finishAt）时，应返回错误
- 当 job 已经收取过（status=collected）时，应返回错误
