# Phase 2：对外 Agent Skill（待实施）

产出一份给第三方 AI Agent 看的**自包含 Skill 文档**（`skill/SKILL.md`）。Agent 凭此文档 + username/password 即可调用全部业务能力。**不改服务端代码**。

## 交付物

单文件 `docs/develop/phase2/skill/SKILL.md`，结构：

1. tRPC HTTP 通用约定（入口、`{json}` 包裹、响应形状、Authorization 头）
2. 拿令牌 / 用令牌
3. 错误处理与重试（统一表 + 决策树）
4. 能力清单（9 router / ~25 procedure，每条：用途/登录/方法/入参/响应/失败语义）
5. 最小可玩闭环（bash + cURL）
6. 反模式与禁止行为

## 覆盖 Router

apiAccessToken, person, plot, building, inventory, factory, shop, purchasingStation, item

## 验收

- 未读源码的 Agent 仅凭 SKILL.md + 凭证完成 4 步闭环（generate → me → plot.list → plot.purchase）
- 令牌被外部作废后 Agent 自动恢复
- 能力清单与 appRouter 实际挂载一对一
- 错误文案与源码完全一致

## 任务

- [ ] 搭骨架 + 第 0~4 节（调用基础设施）
- [ ] 第 5 节能力清单（按五段模板逐 router 写）
- [ ] 第 6~7 节闭环示例 + 禁止行为
- [ ] 对账清单 + 静态校验 + 端到端演练
