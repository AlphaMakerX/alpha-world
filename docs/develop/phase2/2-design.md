# Phase 2 Design：对外 Agent Skill（API 玩法手册）

> 对应 Proposal：[1-proposal.md](./1-proposal.md)

## 总体思路

本阶段的「设计」基本不是软件设计，而是**文档设计**。服务端的能力已在 [Phase 1](../phase1/README.md) 全部就位，Agent 只需要"会调"。所以本设计要回答 4 件事：

1. **文档落在哪、长什么样**——一个 Agent 一次性 `cat` 即可读完的单文件。
2. **每个能力怎么写**——所有 router 复用同一套五段模板，让 Agent 用同一套解析逻辑处理。
3. **示例怎么写**——只用 cURL（语言中立），其它语言由 Agent 自己翻译。
4. **怎么防漂移**——给一份「router → skill 章节」的对账清单，作为后续维护与 PR review 的基准。

## 文档落点

```
docs/develop/phase2/
├── 1-proposal.md                       # 已存在
├── 2-design.md                         # 本文件
├── 3-test.md                           # 后续
├── 4-task.md                           # 后续
├── 5-conclusion.md                     # 后续
├── README.md                           # 后续（与 phase1 同形）
└── skill/
    └── SKILL.md                        # 唯一对外交付物
```

设计要点：

- **唯一交付物 = 一个文件**：`docs/develop/phase2/skill/SKILL.md`。Agent 只需把它喂给上下文即可，不需要先理解仓库目录。
- **放在 `skill/` 子目录**：让"skill"在文件系统层面就是一个**可独立搬运的单元**——后续若有 examples 脚本、附录截图等，全部塞进同目录，整个目录可以被打包/复制到其它仓库或 cursor skill 注册表，无需改路径。
- **不在 `docs/develop/` 之外建目录**：保持发布分阶段的传统（每个 phase 自带子目录），不污染仓库根。
- **PLAN.md 不在本阶段动**：等 conclusion 阶段统一回写"Phase 2 已完成 + 入口链接"，避免文档先于内容上线。

## SKILL.md 的整体结构

按以下顺序自顶向下，目的是让 Agent **从上到下**线性阅读后即可开干，无需回跳：

```
SKILL.md
├── 0. 这是给谁看的（适用读者 + 前置条件）
├── 1. tRPC HTTP 通用约定（4 条）
├── 2. 拿令牌（apiAccessToken.generate）
├── 3. 用令牌（Authorization 头 + 优先级）
├── 4. 错误处理与重试约定（统一表格 + 决策树）
├── 5. 能力清单（按 router 分章，五段模板）
│     5.1 person.*
│     5.2 plot.*
│     5.3 building.*
│     5.4 inventory.*
│     5.5 factory.*
│     5.6 shop.*
│     5.7 purchasingStation.*
│     5.8 item.*
├── 6. 最小可玩闭环（bash + cURL，可直接跑）
└── 7. 反模式与禁止行为
```

设计理由：

- **0/1/2/3/4 节先把"调用基础设施"讲完**：Agent 在进入第 5 节"能力清单"前，已经具备了所有调任意接口的通用知识；后面每个 router 章节只需要写"业务参数"。
- **第 5 节是参考手册，不是教程**：Agent 在执行任务时按需查阅；章节顺序按依赖关系排序（先 person/plot 这些"看世界"的，再 building/factory 这些"造东西"的，再 shop/purchasing-station 这些"做交易"的）。
- **第 6 节给一个最小闭环**：让 Agent 把"基础设施 + 业务参数"拼起来跑通一次，验证自己理解正确；同时它也是产品验收的 smoke test。
- **第 7 节集中列禁止行为**：统一接收来自 proposal 与 Phase 1 的反模式约束，避免散落在各章节。

## 能力清单的五段模板

第 5 节里每一个 procedure 都用**完全相同**的小节模板，便于 Agent 用 RegExp / 标题分级解析：

```
#### <router>.<procedure>

- **用途**：一句话说明业务意图。
- **登录**：是 / 否（是 = 必须带 Bearer；否 = 可不带）。
- **方法**：query / mutation。
- **入参**：用 TypeScript 风格对象描述字段、类型、约束（来源是项目的 zod schema，但用注释说明，不贴 zod 代码）。无入参写 `null`。
- **成功响应**：`result.data.json` 的形状 + 一段去敏的真实形状示例。
- **失败语义**：表格列出 `message` → 含义 → Agent 应做的动作（重试 / 改入参 / 放弃）。
```

设计要点：

- **入参用 TypeScript 风格而非 zod**：Agent 读 `username: string` 比读 `z.object({ username: z.string().min(1) })` 直接得多；具体约束（min/max、UUID 格式等）写成 TS 行内注释 `// uuid; 来自 plot.list`。
- **响应只描述形状不描述全字段**：游戏数据字段较多，强制全列会让 SKILL.md 膨胀且难维护。原则：**写够 Agent 决策需要的字段**（如 `me` 必写 `goldCoins / position`，但人格 profile 的全部 trait 字段可以只写"对象，字段见 personaProfile 响应"）。需要进一步全字段时由 Agent 调一次实测自查。
- **失败语义只列 Agent 真会遇到的**：zod 校验失败这种"开发期错误"不进表，只写运行期可恢复 / 必须放弃的错误。
- **`{ ok, ... }` 样的内层 use case 结果**：Phase 1 已经在 `unwrapUseCaseResult` 里把它压扁成「成功直接返回 data，失败抛 TRPCError」——所以 Agent 看到的永远是 tRPC 的标准 `result.data.json` / `error.json` 形状，无需理解 use case 的内部双形态。这一约定要在第 1 节明确写出。

### 五段模板示例（design 用，不写进 SKILL.md 原文）

```
#### plot.purchase

- 用途：买下一块未被占用的地块，扣金币、地块归己。
- 登录：是。
- 方法：mutation。
- 入参：
    {
      plotId: string  // uuid，来自 plot.list 返回中的 id 字段
    }
- 成功响应：result.data.json
    {
      plot: { id, ownerUserId, ... },
      buyer: { id, goldCoins }   // 扣款后的剩余金币
    }
- 失败语义：
    | message              | 含义                  | Agent 应做                   |
    | 金币不足             | 余额 < 地块价         | 放弃；先去赚钱再来           |
    | 地块已被占用         | 并发被人买走          | 重新拉一次 plot.list         |
    | 地块不存在           | plotId 错             | 修正入参                     |
```

> 注：上述失败 message 的具体文案在 task 阶段以源码为准对账，不在 design 中固化。

## 示例语言：只用 cURL

- 唯一示例语言 = **cURL**。理由：语言中立、HTTP 语义透明、与 Phase 1 README 一致；Node `fetch` / Python `httpx` 等的等价写法对 Agent 是机械翻译，不需要 SKILL.md 罗列。
- 所有 cURL 示例**统一格式**：
  - 单引号包 JSON body，避免 shell 转义；
  - body 永远写成 `{"json": <input>}`（即使 input 是 `null`）以免 Agent 学半套；
  - host 全部写 `http://localhost:3000`，并在第 1 节用一句话说明「生产环境替换 host 即可，路径不变」。
- **不**演示如何把响应反序列化、如何抽取嵌套字段——那是 Agent 自己的事，SKILL.md 只保证**给到正确的请求与正确的响应形状描述**。

## 错误处理与重试的呈现

第 4 节用「一表 + 一图」形式：

**统一错误表**（全文唯一一份，不在每个 procedure 重复）：

| HTTP 形态 | `error.json.message` | 触发条件 | Agent 决策 |
|-----------|----------------------|----------|------------|
| 400 BAD_REQUEST | zod 派生消息 | 入参字段不符合约束 | 修正入参，不要重试 |
| 401 UNAUTHORIZED | `请先登录` | 没带 `Authorization` 头 | 带上 Bearer 后重试 |
| 401 UNAUTHORIZED | `API 令牌无效或已失效` | 带了 Bearer 但解析失败/已被覆盖 | 调 `apiAccessToken.generate` 拿新令牌后重试 |
| 401 UNAUTHORIZED | `用户名或密码错误` | 调 `apiAccessToken.generate` 时凭证错 | **不要**重试；让上层提供正确凭证 |
| 4xx 业务相关 | 如「金币不足」「库存不足」「地块已被占用」 | 业务前置条件不满足 | 业务层决策；不盲目重试 |
| 5xx / 网络层 | — | 服务端异常或网络抖动 | 指数退避（如 1s / 2s / 4s），最多 3 次 |

**决策树**（伪代码块，不画图）：

```
收到错误
├── HTTP 5xx 或网络错误 → 指数退避重试 (≤3 次)
├── message == "API 令牌无效或已失效" → 重生成令牌 → 重试一次
├── message == "请先登录" → 带上 Bearer → 重试一次
├── message == "用户名或密码错误" → 终止；要求人介入
└── 其它（业务错） → 不重试；交业务层决策
```

设计要点：

- **错误表是 SKILL.md 内**唯一一份**错误码索引**——各 procedure 章节只写"业务专属"的错误（如"金币不足"），通用错误指向第 4 节。
- 表格的"Agent 决策"列必须写**动作**，不只是"含义"。这是 proposal「机器可解析、可重试」的硬要求。
- 重试上限与退避节奏在文档里**写死具体数字**，避免每个 Agent 自己拍脑袋导致行为发散。

## 最小可玩闭环示例

第 6 节给一段约 30~50 行的 bash 脚本，要求：

- **依赖最小**：只用 `curl`、`jq`，不要求装 node/python。
- **可直接 copy-paste 执行**：把 `USERNAME` / `PASSWORD` 顶端两行作为变量，其它行不需要修改。
- **覆盖 4 步**（与 proposal 验收对齐）：
  1. `apiAccessToken.generate` 拿令牌 → 用 `jq` 提取 `result.data.json.token` 存到 `TOKEN` 变量；
  2. `person.me` 拉账号 → 打印金币与位置；
  3. `plot.list` 拉世界 → 打印未售地块数量；
  4. 触发一次写操作 → **选择 `plot.purchase`**（因为它依赖最少：只要金币够 + 有未售地块就能跑通），并打印购后状态。
- **写操作选 `plot.purchase` 而不是 `factory.startProduction`**：后者还要先有建筑、有配方、有原料库存，前置太多；purchase 是"金币 → 资产"最短路径，最适合做 smoke test。
- **失败处理示范**：脚本里给一段注释，说明"如果 step 4 报金币不足/无可购地，应跳到第 5 节哪个 procedure 去补救"——既是 demo 又是对 SKILL.md 内部章节的导航测试。

脚本保存在 SKILL.md **正文里**，不外置成单独 `.sh` 文件——保证 Agent 不会因"漏读外部文件"而漏掉示例。

## 与 Phase 1 README 的关系

| 内容 | 在 phase1/README.md | 在 SKILL.md | 一致性约束 |
|------|---------------------|-------------|------------|
| 拿令牌 cURL 示例 | 有 | 有（重写一遍） | 命令、字段名、错误文案必须**完全一致** |
| Bearer 调 tRPC 示例 | 有 | 有（重写一遍） | 同上 |
| 错误码区分表 | 有简版 | 有完整版（含决策列） | message 文案必须一致；SKILL.md 多出的"决策"列不与 README 冲突 |
| 模块导航 | 有 | **无** | SKILL.md 不提仓库内路径，保持读者中立 |
| `apiAccessToken.generate` 拒绝 Bearer 续命 | 有 | 有（在第 7 节"反模式"重申） | 措辞一致 |

设计原则：**自包含 > DRY**。SKILL.md 不依赖读者读过 README，所以必要内容**重复**而不是引用。这带来一处维护成本：两边修改时必须同步——这一约束写进维护说明（见下节）。

## 维护与防漂移

skill 文档与源码会自然漂移（router 改名、字段增删、错误文案改）。本 design **不**引入 codegen 或类型反射，原因：

- 当前游戏 router 数量约 8 个、procedure 总数 ~30 个，规模手写可控。
- 引入 codegen 会把"一份 Markdown"变成"一份 Markdown + 一段构建脚本 + 一段 CI 校验"，与 proposal「最简单做法」相悖。

替代方案：

1. **对账清单**（写进 SKILL.md 末尾的「当前覆盖范围」一节，由 task 阶段一次性产出）：
   - 列出 SKILL.md 覆盖的全部 `<router>.<procedure>`；
   - 给出对应源码路径（`src/server/lib/trpc/routers/<x>.ts`）作为脚注；
   - PR review 规则：**任何**改动到 `src/server/lib/trpc/routers/*.ts` 的 PR，必须同时改 `SKILL.md`（或在 PR 描述中显式声明"无对外行为变更"）。
2. **对账清单同时写进 phase2 README**，作为"本阶段验收的具体清单"。
3. **不做** lint / CI 检查脚本：留待 router 数量翻倍或漂移真的出现时再升级；本阶段保持手工。

## 关键决策与理由

| 决策 | 理由 |
|------|------|
| 单文件 `SKILL.md`，放在 `skill/` 子目录 | 单文件 = Agent 一次读完；子目录 = 未来加附属物不破坏路径 |
| 不做 SDK / MCP / codegen | proposal 明确排除；规模不必要 |
| 示例只用 cURL | 语言中立；与 phase1/README.md 风格一致 |
| 五段模板统一所有 procedure | Agent 可用同一套解析逻辑；review 时也能逐项对账 |
| 错误表全文唯一，不分散到每个 procedure | 通用错误集中维护；procedure 章节只写业务专属错 |
| 自包含 > DRY，必要内容与 README 重复 | Agent 不应跳转；同步成本由 PR 规则吸收 |
| 最小闭环用 `plot.purchase` 做写操作 | 前置最少（金币 + 未售地块），最适合 smoke test |
| 防漂移靠对账清单 + PR 规则，不靠 CI | 8 router / 30 procedure 规模手控可达；引入 CI 复杂度收益不抵 |
| PLAN.md 推迟到 conclusion 阶段更新 | 文档先于内容上线会让"已完成"清单失真 |

## 数据流（端到端）

文档无运行时数据流。读者 Agent 的"使用流"如下：

```
Agent 启动任务
  ├── 读 SKILL.md（一次）
  ├── 读自己的 username/password（来自调用方）
  ↓
[首次] apiAccessToken.generate → 落盘保存 token
  ↓
[每次业务请求] Bearer <token> → tRPC procedure → 解析响应
  ├── 成功 → 业务逻辑继续
  └── 失败 → 查 SKILL.md 第 4 节决策表 → 重试 / 重生成令牌 / 放弃
```

## 不在本阶段范围

- 任何服务端改动（含错误文案对齐、字段重命名等"为 skill 而做"的微调）——发现问题写进 inbox / bug list，不在本阶段顺手改。
- 多语言示例（Node / Python / Go）。
- SDK / MCP server / cursor skill 注册表打包发布。
- `auth.register` 章节——Agent 自带凭证。
- 自动化校验脚本（CI 检查 SKILL.md 与 router 同步）——留待规模升级。
