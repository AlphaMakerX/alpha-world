# Phase 2：对外 Agent Skill

> 规格与实现：[1-proposal.md](./1-proposal.md) · [2-design.md](./2-design.md) · [3-test.md](./3-test.md) · [4-task.md](./4-task.md) · `5-conclusion.md`（待写）

基于 [Phase 1 的 API 访问令牌](../phase1/README.md)，产出**一份给第三方 AI Agent 看的玩法手册**：让任何已有 `username` + `password` 的外部 Agent，在不读源码、不开浏览器、不管理 Cookie 的前提下，端到端调用本游戏全部「需登录」业务能力（看自己 / 看世界 / 购地 / 建造 / 生产 / 交易）。

本阶段**不动服务端代码**——所有依赖能力 Phase 1 已上线；这里唯一交付物就是一份单文件 Markdown。

## 唯一交付物

[`skill/SKILL.md`](./skill/SKILL.md) — 自包含、可一次喂给 Agent 上下文的玩法手册，覆盖：

- tRPC HTTP + superjson 的调用约定（4 条）
- 用 `username + password` 拿令牌、用 Bearer 调业务接口
- 错误码 → 文案 → 重试动作的完整决策表
- **9 个 router / 25 个 procedure** 的能力清单（每条同形：用途 / 登录 / 方法 / 入参 / 成功响应 / 失败语义）
- 一段 `bash + curl + jq` 的最小可玩闭环（直接 copy-paste 跑）
- 反模式与禁止行为
- 对账清单（`<router>.<procedure>` ↔ 源码路径）

## 谁该读、怎么用

- **第三方 Agent 开发者**：把 `skill/SKILL.md` 整篇喂给你的 Agent 上下文（系统提示或 RAG 入库均可），再给它一对真实凭证，即可开始玩。
- **本仓库贡献者**：任何对 `src/server/lib/trpc/routers/*.ts` 的改动 PR，应同步修订 `skill/SKILL.md`（或在 PR 描述里声明「无对外行为变更」）。SKILL.md 末尾的对账表是 review 时的对照基准。

## 维护约定

- 不引入 codegen / CI 自动校验；规模可控时手工对账即可（见 [4-task.md](./4-task.md) 任务 6）。
- 文档语言：仅中文，与项目其它规格一致。
- 与 [Phase 1 README](../phase1/README.md) 的「如何携带 Bearer 调用 tRPC」一节**不冲突**——SKILL.md 是它的扩展版（自包含、对外、覆盖更广）。
