# 测试规格：start-rest-use-case

对应源码：`src/server/features/residential/application/start-rest-use-case.ts`

## 在自己住宅休息 — 正常流程

- 当玩家在自己的住宅发起休息时，应创建 RestJob（status=in_progress, finishAt=now+300s）
- 当玩家在自己的住宅休息时，应扣除 500 金币，收款方为 Adam（系统账户）
- 当玩家在自己的住宅休息时，financeService.transfer 应使用 residential_rest 类型

## 在别人住宅休息 — 正常流程

- 当玩家在别人的住宅休息（主人定价 1000）时，应扣除 1000 金币
- 当玩家在别人的住宅休息时，90%（900）应转给住宅主人，10%（100）归 Adam
- 当玩家在别人的住宅休息时，financeService.transfer 应使用 residential_rest_service 类型

## 校验 — 建筑类型

- 当建筑不是住宅类型时，应返回错误
- 当建筑不存在时，应返回 NOT_FOUND

## 校验 — 并发限制

- 当该住宅已有进行中的休息任务时，应返回错误（CONFLICT）

## 校验 — 定价

- 当在别人住宅休息但主人未设定价格（restPrice=null）时，应返回错误

## 校验 — 金币

- 当金币不足时，应返回错误，不创建任务、不扣款

## 边界情况

- 当主人定价为 0 时，应成功休息，Adam 抽成 0，主人收入 0
- 当主人定价含小数时，抽成应正确计算（向下取整或保留小数，跟随 FinanceService 精度）
