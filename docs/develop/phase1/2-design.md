# Phase 1 Design：API Access Token

> 对应 Proposal：[1-proposal.md](./1-proposal.md)

## 总体思路

在现有「NextAuth（JWT/Credentials）→ tRPC context.userId」体系之外，**并行增加**一条凭证通路：

- **生成路径**：一个 tRPC `publicProcedure`，入参 `{username, password}`，服务端用既有 `passwordHasher.verify` 校验后，为该用户幂等签发一把新令牌，响应一次性返回明文；同时把旧令牌（若有）作废。
- **使用路径**：tRPC HTTP handler 在构造 context 时解析 `Authorization: Bearer <token>`，查摘要表命中 → `userId = 该行 user_id`；业务 `protectedProcedure` 原样工作，不关心来源。

业务代码无需改动：所有依赖登录的 procedure 已通过 `ctx.userId` 取身份（见 `src/server/lib/trpc/core.ts`）。本设计**不改** NextAuth 配置、**不改** `users` 表、**不改**密码存储方式。

## 目录与模块划分

新增一个与 `auth/`、`person/` 并列的 feature：

```
src/server/features/api-access-token/
├── domain/
│   ├── entities/api-access-token.ts           # 聚合：user_id + tokenHash + 时间戳
│   └── services/
│       ├── token-generator.ts                 # 接口：生成高熵明文令牌
│       └── token-hasher.ts                    # 接口：明文 → 摘要（等值比对用）
├── application/
│   └── generate-api-access-token-use-case.ts  # 用例：校验密码 → 幂等签发 → 返回明文
├── infrastructure/
│   ├── schema.ts                              # Drizzle 表定义
│   ├── api-access-token-repository.ts         # upsert / findByHash
│   ├── crypto-token-generator.ts              # crypto.randomBytes(32) + base64url
│   └── sha256-token-hasher.ts                 # crypto.createHash("sha256")
└── composition/
    └── index.ts                               # 装配依赖 + 导出 executeXxx / schema
```

并在现有位置做**最小改动**：

| 位置 | 改动 |
|------|------|
| `src/server/lib/db/schema.ts` | `export * from "@/server/features/api-access-token/infrastructure/schema";` |
| `src/server/lib/trpc/routers/` | 新增 `api-access-token.ts` 并在 `_app.ts` 挂载 |
| `src/app/api/trpc/[trpc]/route.ts` | `createContext` 内增加 Bearer 解析 |

## 持久化

**独立一对一行表**，而非往 `users` 加列——理由：令牌是独立生命周期资产，与人物状态（金钱、位置、体力）无关；独立表便于今后扩展（审计、上次使用时间）而不污染热表。

```sql
-- drizzle 生成后大致如下，以 Drizzle schema 为准
create table user_api_tokens (
  user_id     uuid        primary key references users(id) on delete cascade,
  token_hash  char(64)    not null unique,          -- sha256 hex
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

- `user_id` 既是主键又是外键，天然表达「每个用户至多一把」。
- `token_hash` 加 `unique`：保证不同用户不会撞同一摘要（在随机生成 256 位熵下，这是理论约束而非运行期瓶颈）；Bearer 读路径可用此索引等值命中。
- **不存**明文列、不存"曾经的旧 token"、不存撤销表——幂等覆盖即失效，已够满足 proposal。

迁移方式：沿用项目现有约定，`drizzle-kit generate` 产出新迁移落到 `drizzle/`；`npm run drizzle:push` 应用到本地。

## 领域与用例

### 实体与值对象

- `ApiAccessToken` 聚合：`userId`、`tokenHash`、`createdAt`、`updatedAt`。领域层不持有明文——明文只在用例层短暂出现后丢弃。
- 明文格式：`awt_` 前缀 + `base64url(32 random bytes)`。前缀作用是误粘贴识别与日志脱敏规则；非安全要素。

### 领域服务接口（便于测试替身）

- `TokenGenerator.generate(): string`（纯随机，无状态）。
- `TokenHasher.hash(plain): string`（SHA-256 hex）。选 SHA-256 而非 bcrypt：明文本身就是 256 位高熵随机，不需要抗字典；每次业务请求都要做一次哈希并查表，性能必须是 O(µs) 级。

### 应用用例：`generateApiAccessToken`

输入：`{ username, password }`；输出：`{ plainToken }`。

流程：

1. 用 `userRepository.findByUsername` 取用户；未命中 → 返回与现有登录相同语义的错误（见下「错误语义对齐」）。
2. `passwordHasher.verify(password, user.passwordHash)` 失败 → 同上错误。
3. `tokenGenerator.generate()` → `plain`。
4. `tokenHasher.hash(plain)` → `hash`。
5. `apiAccessTokenRepository.upsertForUser({ userId: user.id, tokenHash: hash })` —— `ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, updated_at = now()`。**该步完成即旧令牌立刻失效**。
6. 返回 `plain`。

用例**不依赖 tRPC context**，也**不读取** Web 会话——与 proposal「只接受用户名+密码」一致。

### 错误语义对齐

现有 `executeLoginUserUseCase` 对「用户名不存在」与「密码错误」的返回码统一到同一个不可区分的失败响应（参见 `src/server/features/auth/application/login-user-use-case.ts`）。本用例**复用同一错误码与文案**，实现上可直接把「找用户」和「校验密码」两步委托给 `auth` feature 已有的「用户名+密码认证」辅助函数，或在本 feature 内以相同分支返回相同 `{ ok:false, code, error }` 形状。避免账户存在性泄漏由此一致性保证。

## Bearer 读路径（tRPC context 增强）

改动点集中在 `src/app/api/trpc/[trpc]/route.ts` 的 `createContext`：

```ts
// 示意，实际以实现为准
const bearer = readBearer(req.headers.get("authorization"));
const tokenUserId = bearer
  ? await apiAccessTokenRepository.findUserIdByHash(sha256Hex(bearer))
  : null;

const session = await getServerSession(authOptions);
const sessionUserId = (session?.user as { id?: string } | undefined)?.id ?? null;

// 身份优先级：Bearer 优先于 Session
const userId = tokenUserId ?? sessionUserId;

return { session, userId };
```

设计要点：

- **优先级唯一且固定：Bearer > Session**。proposal 要求"唯一可文档化"；选 Bearer 优先的理由是脚本场景下携带令牌的意图显式、稳定，不受浏览器残留 cookie 干扰。
- **Bearer 命中时 `session` 字段保留原值（可能为 null）**：不伪造 NextAuth session 对象。这自动满足 proposal 的约束「携带令牌不创建/延长 Web 会话」——tRPC 不会触发 NextAuth 的 session 刷新，NextAuth cookie 也不会因 Bearer 请求而写回。
- **Bearer 无效（格式错、未命中摘要）**：视为未提供，回退到 Session 路径；返回给调用方的"授权失败"由业务 procedure 的 `protectedProcedure` 统一产出 `UNAUTHORIZED`。proposal 要求"错误信息区分未登录与令牌无效"——在 HTTP 层增加一步：若 `Authorization` 头存在但解析/命中失败，向响应附加一个可区分的错误提示（由 test/3-test.md 定义具体形式）。
- **格式解析与比较**：
  - 头部 scheme 大小写不敏感，`Bearer ` 之后 trim；
  - 明文长度上限（例如 256）防止异常长度进入哈希；
  - 命中走数据库 unique 索引等值查询，不做全表扫描；
  - 由于用的是 DB 等值查找而非内存逐行比对，不需要 `timingSafeEqual`——数据库层的等值匹配不暴露摘要值本身。

## 对外 tRPC 接口

新增 `apiAccessTokenRouter`：

| 过程 | 类型 | 入参 | 出参 | 身份 |
|------|------|------|------|------|
| `generate` | `publicProcedure.mutation` | `{ username: string, password: string }` | `{ token: string }` | 只信任入参密码校验；**不读** `ctx.userId` |

放在 `publicProcedure` 而非 `protectedProcedure`：本过程**自带身份证明**，不依赖 context 已解析出的身份。即便请求同时带了 Bearer 或 Session，这个 procedure 都**只**依据入参的 `username`/`password` 做决定——这样实现上自然排除了 proposal 禁止的「凭 Bearer 刷新自己」。

挂载位置：`src/server/lib/trpc/routers/_app.ts` 中加 `apiAccessToken: apiAccessTokenRouter`。

前端用法（与现有 `auth.register` 一致的习惯）：

```ts
const { token } = await trpc.apiAccessToken.generate.mutate({ username, password });
```

本阶段**不**新增专用前端页面；CLI / 脚本即是主要使用者。如果后续要加 Web 入口，只是增加一个表单调同一 procedure，不改服务端。

## 关键决策与理由

| 决策 | 理由 |
|------|------|
| 新建独立 `api-access-token` feature，不塞进 `auth` | `auth` 聚焦"成为已知身份"（注册/登录），token 聚焦"派发与使用"；职责分离、依赖单向（token → auth 的 passwordHasher） |
| 独立一对一表 `user_api_tokens` | 不污染 `users`；`user_id` 为主键天然保证"至多一把" |
| 摘要用 SHA-256，不用 bcrypt | 明文是 256-bit 高熵随机；每次请求都要查摘要表，需 O(µs) 查询性能 |
| 明文带 `awt_` 前缀 | 肉眼可识别、日志脱敏规则清晰；非安全要素 |
| Bearer 优先于 Session | 文档化唯一规则；脚本场景显式覆盖浏览器残留身份 |
| 生成接口为 `publicProcedure` | 身份自带（用户名+密码），不依赖 ctx；从而天然不接受 Bearer/Session 作为身份证明 |
| 幂等 upsert，不做版本历史 | proposal 明确"至多一把、旧即失效"；无需撤销表或版本链 |

## 数据流（端到端）

**生成（首次或再生成相同）**：

```
client → tRPC apiAccessToken.generate({username, password})
      → passwordHasher.verify
      → tokenGenerator.generate() / tokenHasher.hash()
      → user_api_tokens upsert (user_id PK)
      → { token: "awt_..." } 一次性返回
```

**业务调用（携带 token）**：

```
script → Authorization: Bearer awt_xxx → /api/trpc/...
       → createContext: sha256(xxx) 查 user_api_tokens → userId
       → protectedProcedure → 业务 procedure（与 Session 来源的请求无差别）
```

**再生成（幂等）**：

```
client → apiAccessToken.generate({username, password})
       → upsert 覆盖 token_hash
       → 旧 "awt_..." 在 createContext 查询时不再命中 → 业务请求失败
```

## 与 Phase 2 的衔接

Phase 2 的 Skill 文档只需要告诉用户：

1. 凭 `username`/`password` 调一次 `apiAccessToken.generate`，把 `token` 保存到本地。
2. 之后对 `/api/trpc/*` 的请求附上 `Authorization: Bearer <token>`，即可访问所有登录态业务能力。
3. 不再需要任何 cookie / session 管理。

无需对服务端再做 Phase 2 专属改动。

## 不在本阶段范围

- 元信息查询接口（是否已配置、最近生成时间等）——proposal 明确排除。
- 令牌撤销而不重新生成的单独接口——"再次生成"即撤销。
- 任何形式的"管理令牌用令牌"——生成接口只接受用户名+密码。
- 多端并行令牌、命名、范围——proposal 明确排除。
