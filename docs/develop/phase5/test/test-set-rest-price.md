# 测试规格：set-rest-price-use-case

对应源码：`src/server/features/residential/application/set-rest-price-use-case.ts`

## 正常流程

- 当住宅主人设定价格（如 800）时，应更新建筑的 restPrice 为 800
- 当住宅主人设定价格为 null 时，应关闭对外休息服务（restPrice=null）
- 当住宅主人设定价格为 0 时，应允许（免费开放）

## 校验

- 当建筑不是住宅类型时，应返回错误
- 当调用者不是地块所有者时，应返回错误
- 当价格为负数时，应返回错误
