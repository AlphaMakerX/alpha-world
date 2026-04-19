# Phase 1：API Access Token

> 规格与实现：[1-proposal.md](./1-proposal.md) · [2-design.md](./2-design.md) · [3-test.md](./3-test.md) · [4-task.md](./4-task.md) · [5-conclusion.md](./5-conclusion.md)

为账号提供一把长期、可再生的 API 访问令牌，使脚本/自动化在无浏览器 Cookie 的情况下，以本人身份调用所有「需要登录」的 tRPC 业务能力。

## 如何携带 Bearer 调用 tRPC

tRPC 的 HTTP 入口为 `POST /api/trpc/<router>.<procedure>`，请求体使用 [superjson](https://github.com/blitz-js/superjson) 序列化的 `{ json, meta? }` 包裹。下文示例均以 `cURL` 演示，其它语言（Node `fetch`、Python `httpx` 等）参照 HTTP 语义即可。

### 1. 用「用户名 + 密码」生成令牌

生成接口为 `apiAccessToken.generate`，是 `publicProcedure.mutation`。**唯一**的身份证明就是入参里的 `username` / `password`——即便请求同时带了 Session Cookie 或旧 Bearer，服务端也只看入参。

```bash
curl -X POST http://localhost:3000/api/trpc/apiAccessToken.generate \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "username": "alice",
      "password": "your-password"
    }
  }'
```

成功响应（`result.data.json.token` 为新明文）：

```json
{
  "result": {
    "data": {
      "json": { "token": "awt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
    }
  }
}
```

注意：

- 明文**只在这一次响应里**返回，服务端不再保存，请立即落到本地安全存储。
- 同一账号每次调用都会**覆盖**上一把令牌：旧令牌在 upsert 完成的瞬间即失效，无需额外撤销。
- 错误语义与登录接口同形：用户名不存在或密码错误均返回 `用户名或密码错误`，不泄漏账户存在性。

### 2. 用令牌调用业务接口

把上一步拿到的明文放进 `Authorization` 头即可，scheme 大小写不敏感：

```bash
curl -X POST http://localhost:3000/api/trpc/person.getMe \
  -H "Authorization: Bearer awt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{ "json": null }'
```

服务端在 `createContext` 里会：

1. 解析 `Authorization: Bearer <token>` → `sha256` → 命中 `user_api_tokens.token_hash`；
2. 把命中的 `user_id` 作为 `ctx.userId`；
3. 同时调用 `getServerSession(...)`，但 **Bearer 优先于 Session**——即便浏览器 Cookie 解析出另一个用户，业务层看到的也是 Bearer 所属用户。

`ctx.session` 字段始终只来自 NextAuth，不会因 Bearer 而被伪造，响应也不会写回 `Set-Cookie: next-auth.session-token=...`，所以脚本调用**不会**隐式创建或延长任何 Web 登录会话。

### 3. 错误码区分「未登录」vs「令牌无效」

`protectedProcedure` 在 `ctx.userId` 为空时统一返回 `UNAUTHORIZED`，但 `message` 会区分两种情形，便于脚本排查：

| 请求情况 | 错误 message |
|----------|--------------|
| 未带 Cookie，未带 `Authorization` 头 | `请先登录` |
| 带了 `Authorization` 头但格式异常 / 摘要未命中 / 已被覆盖 | `API 令牌无效或已失效` |

收到 `API 令牌无效或已失效` 时，处理方式只有一种：**重新调用 `apiAccessToken.generate` 生成新令牌**，没有「找回旧令牌」一说。

### 4. 常见错误处理

- **令牌遗失**：再次调用 `apiAccessToken.generate`，旧的自动作废，新的立刻可用。
- **令牌泄漏**：同上——再生成一次即覆盖，泄漏的旧明文在下次请求时即失效。
- **格式异常 / 超长 Bearer**：会被静默视为「未命中」，不会触发 500；`tokenPresentButInvalid` 标记仍然生效，错误消息为 `API 令牌无效或已失效`。
- **生成接口拒绝 Bearer 续命**：仅带 Bearer 不带 `password` 调 `apiAccessToken.generate` 必失败，这是为了避免「持钥者无需密码即可永久续命」。

## 模块导航

- 持久化与摘要：[`src/server/features/api-access-token/infrastructure/`](../../../src/server/features/api-access-token/infrastructure)
- 用例与失败语义对齐：[`src/server/features/api-access-token/application/generate-api-access-token-use-case.ts`](../../../src/server/features/api-access-token/application/generate-api-access-token-use-case.ts)
- Bearer 解析与组装：[`src/server/features/api-access-token/composition/`](../../../src/server/features/api-access-token/composition)
- tRPC procedure：[`src/server/lib/trpc/routers/api-access-token.ts`](../../../src/server/lib/trpc/routers/api-access-token.ts)
- HTTP context 入口：[`src/app/api/trpc/[trpc]/context.ts`](../../../src/app/api/trpc/[trpc]/context.ts)
