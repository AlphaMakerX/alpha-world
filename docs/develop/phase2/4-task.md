# Phase 2 任务列表

> 对应 Proposal：[1-proposal.md](./1-proposal.md)；Design：[2-design.md](./2-design.md)；Test：[3-test.md](./3-test.md)

本阶段无代码改动，**没有** TDD 节奏。任务是「按 design 写文档 → 按 test 校验文档」。每完成一项标记 `[x]`。

## 任务 1：搭骨架

- [ ] 创建目录 `docs/develop/phase2/skill/`。
- [ ] 在 `skill/SKILL.md` 写好顶层结构（design 第「整体结构」节的 8 节标题），各节正文先留 `TODO`。
- [ ] 第 0 节「这是给谁看的」+ 前置条件填实。

## 任务 2：调用基础设施（第 1~4 节）

- [ ] 第 1 节「tRPC HTTP 通用约定」：4 条（入口、`{json,meta?}` 包裹、响应形状、Authorization 头）。
- [ ] 第 2 节「拿令牌」：`apiAccessToken.generate` 的 cURL + 响应形状 + 凭证管理建议（明文只回显一次、覆盖语义）。
- [ ] 第 3 节「用令牌」：Bearer 头格式、与 Cookie 共存时的优先级（Bearer 优先）、不会延长会话。
- [ ] 第 4 节「错误处理与重试」：统一错误表 + 决策树伪代码 + 退避节奏。
- [ ] 完成后：与 phase1/README.md 对齐文案（用 `rg` 抽样 3 条错误文案逐字对照）。

## 任务 3：能力清单（第 5 节）

按 design 五段模板逐 router 写。每个 procedure 按需查源码以确认字段口径，**不**贴 zod 代码。

- [ ] 5.1 `person.*`（`me` / `updatePosition` / `wealthLeaderboard` / `adamProfile` / `personaProfile`）
- [ ] 5.2 `plot.*`（`list` / `purchase`）
- [ ] 5.3 `building.*`（`build` / `myBuildings`）
- [ ] 5.4 `inventory.*`（`mine`）
- [ ] 5.5 `factory.*`（`recipes` / `orders` / `startProduction`）
- [ ] 5.6 `shop.*`（`createListing` / `listings` / `purchase` / `cancelListing` / `transactionHistory`）
- [ ] 5.7 `purchasingStation.*`（`createBuyOrder` / `buyOrders` / `fulfillBuyOrder` / `cancelBuyOrder` / `transactionHistory`）
- [ ] 5.8 `item.*`（`definitions`）

每写完一个 router，跑一次：`rg "<router>\." src/server/lib/trpc/routers/<router>.ts | wc -l` 与 SKILL.md 中该 router 下小节数量对账。

## 任务 4：闭环示例与禁止行为（第 6~7 节）

- [ ] 第 6 节「最小可玩闭环」：bash + cURL + jq，覆盖「拿令牌 → me → plot.list → plot.purchase」4 步，含失败兜底注释。脚本顶部留 `USERNAME` / `PASSWORD` 两个变量。
- [ ] 第 7 节「反模式与禁止行为」：至少 3 条（不要 Bearer 续命 / 不要期待 Cookie 优先 / 不要拿旧令牌反复重试）。

## 任务 5：对账清单与 README

- [ ] 在 SKILL.md 末尾追加「当前覆盖范围（对账清单）」表格：列出全部 `<router>.<procedure>` 与对应源码路径。
- [ ] 写 phase2 `README.md`（与 phase1 README 同形：阶段简介 + 五份文档导航 + 「Skill 在哪里、谁该读」一节）。

## 任务 6：静态对账（执行 test-skill-structure.md）

- [ ] 运行下面这串 `rg` 对账命令并把结果与 SKILL.md 比对：
  - `rg -o "Router\(\{" src/server/lib/trpc/routers/_app.ts` → 数 router 数量。
  - `rg -o "(query|mutation)\(" src/server/lib/trpc/routers/*.ts | wc -l` → 数 procedure 数量。
  - `rg "请先登录|API 令牌无效或已失效|用户名或密码错误" src/server/` → 验证 SKILL.md 第 4 节文案与源码一致。
- [ ] 按 `test/test-skill-structure.md` 的全部条目逐条核对，全部 ✓ 才算结束。

## 任务 7：端到端演练（执行 test-skill-agent-behavior.md）

- [ ] 选定一个未读过本仓库源码的 LLM Agent（外部模型即可）。
- [ ] 准备一对真实 `username` / `password`（本地新注册一个账号）。
- [ ] 启动本地服务（`npm run dev`），按 `test/test-skill-agent-behavior.md` 的「最小可玩闭环」一节让 Agent 自我驱动跑通。
- [ ] 故意作废 Agent 持有的令牌，按「令牌作废自动恢复」一节验证恢复行为。
- [ ] 按「反模式自动规避」「错误码区分」「业务错误的不重试」抽测 1~2 条。
- [ ] 把演练过程的简短记录（哪些通过 / 哪些发现了问题）落到 `5-conclusion.md`。

## 任务 8：收尾

- [ ] 把发现的「字段偏差 / 文案不一致 / 描述歧义」写进 SKILL.md 修订历史并修复。
- [ ] 把任何「服务端缺陷」（不在本阶段改）记到 `docs/develop/inbox/`。
- [ ] 写 `5-conclusion.md`：交付物链接 + 演练结论 + 维护约定（改 router 必同步改 SKILL.md）。
- [ ] 更新 [`docs/develop/PLAN.md`](../PLAN.md)：把 Phase 2 标为已完成 + 补 SKILL.md 入口链接。
