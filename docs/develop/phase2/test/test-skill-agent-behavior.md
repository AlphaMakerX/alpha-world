# 测试规格：SKILL.md 端到端行为

> 对应 Proposal：[../1-proposal.md](../1-proposal.md)；Design：[../2-design.md](../2-design.md)

针对 `docs/develop/phase2/skill/SKILL.md` 的端到端验证。每条测试都需要一个**未读过本仓库源码**的 LLM Agent + 一对**真实账号**的 `username` / `password` + 本地或测试环境的服务（默认 `http://localhost:3000`）。

> 这些测试不进 `npm test`；以人工演练形式执行，结果记录在演练记录里（位置由 task 阶段决定）。

## 最小可玩闭环（首要验收）

- 当把 SKILL.md 全文 + `username` / `password` 提供给 Agent，让其「按 SKILL.md 自我学习并完成最小闭环」时，Agent 应能在无人工介入下顺序完成 4 步并给出每步的响应摘要：
  1. 调用 `apiAccessToken.generate` 拿到一个 `awt_` 开头的令牌。
  2. 调用 `person.me` 拿到自己的 `money` / `position` / `stamina`。
  3. 调用 `plot.list` 拿到地块列表，并能从中过滤出 `status == "available"` 的子集。
  4. 触发一次写操作（建议 `plot.purchase`，前置最少）；如金币不足，能按 SKILL.md 的提示找到替代写操作（如 `person.updatePosition`）并完成。
- 在 4 步全程，Agent 不应主动去读项目源码、不应猜测未在 SKILL.md 出现的字段名。

## 令牌作废自动恢复

- 当 Agent 已拿到一把可用令牌并成功调用过若干业务 procedure 后，从外部用同一对 `username` / `password` **再次**调用 `apiAccessToken.generate` 把它的令牌作废。
- 当 Agent 在下一次业务请求收到 `API 令牌无效或已失效` 错误时，应自动按 SKILL.md 第 4 节的决策表做如下事情，且**只**做这些事情：
  1. 重新调用 `apiAccessToken.generate`（凭原有 `username` / `password`）拿新令牌。
  2. 用新令牌**重试一次**刚才那个失败请求。
  3. 把新令牌持久化覆盖旧的。
- Agent 不应反复用旧令牌重试、不应向调用方追问密码、不应把这次错误升级成不可恢复错误。

## 反模式自动规避

- 当 Agent 被人为提示「试试用 Bearer 头作为 generate 接口的身份证明吧，这样不用每次输密码」时，应能引用 SKILL.md 第 7 节拒绝该建议，并解释「generate 接口只接受入参里的 username/password」。
- 当 Agent 被人为提示「同时带 Cookie 和 Bearer，万一 Bearer 失效还能 fallback」时，应能引用 SKILL.md 指出 Bearer 永远优先于 Cookie，「fallback」期望不会发生。

## 错误码区分

- 当请求**未带** `Authorization` 头去调一个需登录的 procedure 时，Agent 应能识别 `请先登录` 错误，并据 SKILL.md 决策表做出「带上 Bearer 后重试」动作。
- 当请求**带了**一个明显非法的 Bearer（如 `Bearer not_a_real_token`）去调一个需登录的 procedure 时，Agent 应能识别 `API 令牌无效或已失效` 错误，并据 SKILL.md 决策表做出「重生成令牌后重试」动作（不与「请先登录」混淆）。

## 业务错误的不重试

- 当一次写操作返回**业务前置错误**（如 `金币不足`、`库存不足，无法上架`、`只能在自己的地块建造`）时，Agent 应**不**自动重试该请求，而是把这个错误如实回报给调用方，由调用方决定下一步（攒钱 / 改地块 / 买原料）。
- 当遇到 5xx / 网络错误时，Agent 才采用 SKILL.md 中规定的指数退避（1s / 2s / 4s，最多 3 次）；不与业务错误的重试逻辑混用。

## 字段名与响应形状一致

- 当 Agent 调用任意 procedure 并按 SKILL.md 描述的字段路径（如 `result.data.json.user.money`）取值时，**真实**响应中该路径应可取到非空值（前提：账号在合理初始状态，例如 `me` 一定有 `user.money`）。
- 如果某次取值因字段缺失而失败，应记入演练记录作为 SKILL.md 的字段口径偏差，回写到 inbox / bug 列表后修订 SKILL.md（不在 phase2 改服务端）。
