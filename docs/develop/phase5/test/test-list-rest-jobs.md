# 测试规格：list-rest-jobs-use-case

对应源码：`src/server/features/residential/application/list-rest-jobs-use-case.ts`

## 正常流程

- 当住宅有 1 个进行中 + 2 个已收取的任务时，应全部返回
- 当住宅无任何休息任务时，应返回空列表

## 校验

- 当建筑不存在时，应返回 NOT_FOUND
- 当建筑不是住宅类型时，应返回错误
