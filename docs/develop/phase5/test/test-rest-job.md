# 测试规格：RestJob 实体

对应源码：`src/server/features/residential/domain/entities/rest-job.ts`

## RestJob.start()

- 当传入合法参数时，应创建 status=in_progress 的任务，finishAt = startedAt + 300s
- 当 durationSeconds ≤ 0 时，应抛出 DomainError
- 当 cost < 0 时，应抛出 DomainError
- 当 staminaGain ≤ 0 时，应抛出 DomainError

## canCollect(now)

- 当 status=in_progress 且 now ≥ finishAt 时，应返回 true
- 当 status=in_progress 且 now < finishAt 时，应返回 false
- 当 status=collected 时，应返回 false

## collect(now)

- 当可收取时，应将 status 改为 collected，设置 collectedAt
- 当 status 不是 in_progress 时，应抛出 DomainError
- 当 now < finishAt（未到时间）时，应抛出 DomainError

## ensureRester(userId)

- 当 userId 匹配 resterUserId 时，应不抛出
- 当 userId 不匹配时，应抛出 DomainError

## rehydrate

- 当从持久化数据恢复时，应正确还原所有属性
