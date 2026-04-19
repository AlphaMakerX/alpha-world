# 测试规格：SKILL.md 结构与对账

> 对应 Proposal：[../1-proposal.md](../1-proposal.md)；Design：[../2-design.md](../2-design.md)

针对 `docs/develop/phase2/skill/SKILL.md` 的静态检查。每条都应能通过人工 review 或 `rg` 脚本判定，不需要启动服务。

## 章节齐全（与 design 第「整体结构」节一致）

- 当 SKILL.md 被读完时，应能识别出以下顺序的章节：`这是给谁看的` → `tRPC HTTP 通用约定` → `拿令牌` → `用令牌` → `错误处理与重试` → `能力清单` → `最小可玩闭环` → `反模式与禁止行为` → `当前覆盖范围（对账清单）`。
- 每个章节标题在文档中**唯一**出现一次，方便 Agent 用标题做导航定位。

## 能力清单与源码 router 一对一

- 当列出 `appRouter` 当前挂载的全部 router（见 `src/server/lib/trpc/routers/_app.ts`）时，SKILL.md 第 5 节「能力清单」应**恰好**包含同样的 router 名集合，无遗漏、无多余。
- 对每个 router 的每个 procedure（见 `src/server/lib/trpc/routers/<router>.ts`），SKILL.md 中应有一个对应的小节，标题形如 `<router>.<procedure>`。
- 不在 SKILL.md 内出现服务端尚未挂载或已下线的 procedure。

## 五段模板严格执行

- 当查看任意 `<router>.<procedure>` 小节时，应能找到 5 个固定的元素：**用途 / 登录 / 方法 / 入参 / 成功响应 / 失败语义**（缺一不可）。
- 「登录」字段值只能是 `是` 或 `否`，与该 procedure 在 router 文件里实际使用的 `protectedProcedure` / `publicProcedure` 一致。
- 「方法」字段值只能是 `query` 或 `mutation`，与 router 文件里实际声明一致。

## 错误文案与源码一致

- 当 SKILL.md 第 4 节「错误处理与重试」列出文案 `请先登录` / `API 令牌无效或已失效` / `用户名或密码错误` 时，三处文案应与 `src/server/lib/trpc/core.ts`（`enforceUserIsAuthed` 中的 message）以及 `src/server/features/api-access-token/application/generate-api-access-token-use-case.ts`（`INVALID_CREDENTIALS_RESULT.error`）**完全一致**——一字不差。
- 当 procedure 失败语义表里列出某条业务错误（如 `金币不足`、`只能在自己的地块建造`、`库存不足，无法上架`）时，对应字符串应**真实存在**于该 use-case 源文件中（用 `rg "<文案>" src/server/features/` 至少 1 次命中）。

## superjson 包裹的写法一致

- 所有请求体示例必须形如 `{"json": <input>}`；无入参写 `{"json": null}`。
- 不出现裸 `<input>` 不带 `json` 包裹的请求体示例。

## Authorization 头格式一致

- 所有需要登录的示例请求都带 `Authorization: Bearer awt_xxxxxxxxx`（明文样例可截断），scheme 为 `Bearer`（与 phase1/README.md 一致）。
- 不出现 `Token`、`Basic`、自定义 header 等其它身份方案。

## 与 phase1/README.md 不冲突

- 当对照 `docs/develop/phase1/README.md` 的「如何携带 Bearer 调用 tRPC」一节时，SKILL.md 中关于「拿令牌」「用令牌」「错误码区分」三段的字段名、错误文案、cURL 命令骨架应与 README **不矛盾**——可以更详细，但不可以提供与 README 冲突的事实。

## 反模式齐全

- 当查看第 7 节「反模式与禁止行为」时，至少应包含以下三条明确禁止：
  - 不要凭 Bearer 调 `apiAccessToken.generate` 续命（必须用密码）。
  - 不要在请求里同时发 Cookie 与 Bearer 后期望 Cookie 优先（Bearer 永远优先）。
  - 不要在收到 `API 令牌无效或已失效` 时反复用旧令牌重试（必须重生成）。

## 对账清单存在

- 文档末尾应有「当前覆盖范围（对账清单）」表格：列出 SKILL.md 描述的全部 `<router>.<procedure>` 与对应源码路径 `src/server/lib/trpc/routers/<x>.ts`，作为后续 PR review 的对账依据。
