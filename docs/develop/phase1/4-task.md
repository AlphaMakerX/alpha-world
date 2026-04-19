# Phase 1 任务列表（TDD）

> 对应 Proposal：[1-proposal.md](./1-proposal.md)；Design：[2-design.md](./2-design.md)；Test：[3-test.md](./3-test.md)

实现顺序自下而上。每个任务内严格 **RED（先写测试） → GREEN（再写实现） → typecheck**。除非上一任务 GREEN 且 typecheck 通过，不进入下一任务。

## 任务 1：领域服务与持久化

**目标**：具备"生成高熵明文 → 摘要入库 → 幂等覆盖"三件事的底层能力。

### 1.1 RED

- [x] 在 `src/server/features/api-access-token/` 下按 design 的目录结构建好空文件。
- [x] 为 `CryptoTokenGenerator` 写测试：输出前缀 `awt_`、去前缀后为 base64url、解码后长度 32 字节；两次调用结果不等。
- [x] 为 `Sha256TokenHasher` 写测试：同一明文 hash 稳定、不同明文 hash 不同、输出为 64 位十六进制；长度/字符集断言足以当作契约。
- [x] **Repository 不单独单测**：与项目既有约定一致，`ApiAccessTokenRepository` 的行为由任务 4 的集成测（真实 `Request` → 真实 DB）自然覆盖；任务 1 不引入 testcontainer 等基础设施。
- [x] 运行测试 → RED。

### 1.2 GREEN

- [x] 在 `src/server/features/api-access-token/infrastructure/schema.ts` 定义 `user_api_tokens` 表（见 design）。
- [x] 在 `src/server/lib/db/schema.ts` 追加 `export * from "@/server/features/api-access-token/infrastructure/schema";`。
- [ ] 生成并应用迁移：`npm run drizzle:push`（本地开发环境手动执行；CI/他人机器由同一命令重放）。
- [x] 实现 `CryptoTokenGenerator`、`Sha256TokenHasher`、`ApiAccessTokenRepository`。
- [x] 运行测试 → GREEN。

### 1.3 收尾

- [x] `npx tsc --noEmit` 零错误（项目当前没有单独 `typecheck` 脚本）。

---

## 任务 2：生成用例

**目标**：`generateApiAccessToken` 应用用例完成"校验密码 → 签发 → 返回明文"。

### 2.1 RED

- [x] 按 [test-user-api-access-token.md](./test/test-user-api-access-token.md) 中**不涉及 tRPC / HTTP** 的条目（凭证正确生成、凭证错误失败语义一致、幂等覆盖、明文不落库）写用例级测试，使用替身（stub）`userRepository`、`passwordHasher`、`tokenGenerator`、`tokenHasher`、`apiAccessTokenRepository`。
- [x] 失败分支断言：错误响应的形状（`{ ok: false, code, error }`）与 `executeLoginUserUseCase` 对"密码错误"的返回**同形**（同 `code`、同 `error` 文案）。
- [x] 运行测试 → RED。

### 2.2 GREEN

- [x] 实现 `src/server/features/api-access-token/application/generate-api-access-token-use-case.ts`：
  - 输入 schema 使用 zod，字段 `username` / `password`；
  - 失败分支复用 `auth` feature 对外暴露的"密码错误/用户不存在"错误码与文案，或在本用例内返回严格同形的失败结果；
  - 成功路径：`tokenGenerator.generate()` → `tokenHasher.hash()` → `upsertForUser()` → 返回 `{ ok: true, token: plain }`。
- [x] 在 `src/server/features/api-access-token/composition/index.ts` 装配真实依赖并导出 `executeGenerateApiAccessTokenUseCase` 与输入 schema（参考 `auth/composition/index.ts`）。
- [x] 运行测试 → GREEN。

### 2.3 收尾

- [x] `npx tsc --noEmit` 零错误。

---

## 任务 3：tRPC 生成接口

**目标**：`apiAccessToken.generate` 对外可调用。

### 3.1 RED

- [x] 为 procedure 写 tRPC 层测试（caller 方式或集成测）：
  - 合法入参 → 返回 `{ token: "awt_..." }`；
  - 非法入参 → zod 校验失败；
  - 携带任意 Session / Bearer 但 password 缺失或错误 → 按用例失败语义返回，不得因 Session/Bearer 而成功；
  - 携带 Session/Bearer 且入参正确 → 签发给 `username` 对应用户（非 Session/Bearer 用户）。
- [x] 运行测试 → RED。

### 3.2 GREEN

- [x] 新增 `src/server/lib/trpc/routers/api-access-token.ts`，暴露 `generate: publicProcedure.input(...).mutation(...)`。实现仅调用 `unwrapUseCaseResult(await executeGenerateApiAccessTokenUseCase(input))`，**不读** `ctx`。
- [x] 在 `src/server/lib/trpc/routers/_app.ts` 挂载 `apiAccessToken: apiAccessTokenRouter`。
- [x] 运行测试 → GREEN。

### 3.3 收尾

- [x] `npx tsc --noEmit` 零错误。

---

## 任务 4：Bearer 身份合并

**目标**：带 Bearer 的请求在 tRPC context 里正确解析为 `userId`。

### 4.1 RED

- [x] 按 [test-bearer-request-authentication.md](./test/test-bearer-request-authentication.md) 写集成测试（直接构造 `Request` 调用 `/api/trpc/...` 的 handler，或将 `createContext` 抽一个纯函数便于单测）。至少覆盖：
  - 有效 Bearer 无 Session → `ctx.userId` 为令牌所属用户，`ctx.session` 为 `null`；
  - 无效/过期 Bearer 无 Session → `ctx.userId` 为 `null`；响应需能让调用方区分"令牌无效"与"未登录"；
  - Bearer 与 Session 用户不同 → `ctx.userId` 取 Bearer 所指用户；
  - 响应头不得因 Bearer 请求而产生 `Set-Cookie: next-auth.session-token=...`；
  - `apiAccessToken.generate` 在仅有 Bearer、无 password 时失败。
- [x] 运行测试 → RED。

### 4.2 GREEN

- [x] 在 `src/server/features/api-access-token/composition/index.ts` 导出一个 `resolveUserIdFromBearer(authorizationHeader: string | null): Promise<string | null>` 辅助（内部：解析 Bearer → 长度/格式守卫 → `sha256Hex` → `findUserIdByHash`）。
- [x] 修改 `src/app/api/trpc/[trpc]/route.ts` 的 `createContext`：
  - 读取 `req.headers.get("authorization")`；
  - 并行获取 `getServerSession(authOptions)` 与 `resolveUserIdFromBearer(...)`；
  - `userId = bearerUserId ?? sessionUserId`；
  - `session` 字段只来源于 NextAuth，不因 Bearer 而伪造。
- [x] 让 tRPC 错误响应能让调用方区分"令牌无效"与"未登录"：当 `Authorization` 头存在但解析失败时，在 context 中记录 `tokenPresentButInvalid: true`，并在 `protectedProcedure` 的 middleware 中据此把 `TRPCError.message` 区分两种措辞（例如 `"API 令牌无效或已失效"` vs 现有 `"请先登录"`）。
- [x] 运行测试 → GREEN。

### 4.3 收尾

- [x] `npx tsc --noEmit` 零错误。

---

## 任务 5：全量验证与文档

- [x] `npm test` 全量通过（8 个测试文件、58 个用例全绿）。
- [x] `npx tsc --noEmit` 零错误。
- [x] 在 phase1 [README.md](./README.md) 加 "如何携带 Bearer 调用 tRPC" 一节，给出：
  - 生成令牌的 tRPC 调用示例（`POST /api/trpc/apiAccessToken.generate`）；
  - 业务请求示例（`Authorization: Bearer awt_xxx`）；
  - 令牌遗失处理（再次调用生成接口即覆盖，无找回）。
- [x] 回到 [`PLAN.md`](../PLAN.md)，确认 Phase 1 描述与已完成内容一致，为 Phase 2 留好入口。
- [x] 总结整个模块：见 [5-conclusion.md](./5-conclusion.md)。
