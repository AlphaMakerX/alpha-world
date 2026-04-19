# Phase 1 收尾：API Access Token

> 详细规格：[1-proposal.md](./1-proposal.md) · [2-design.md](./2-design.md)；用法示例：[README.md](./README.md)

## 有什么

- 一张新表 `user_api_tokens`：`user_id` 主键 + `token_hash` 唯一，每个用户至多一把令牌。
- 一个新接口 `apiAccessToken.generate`：凭 `username` + `password` 幂等签发新令牌（旧的同时作废），明文只在本次响应里返回一次。
- 一条新的身份解析路径：tRPC HTTP context 会读 `Authorization: Bearer <token>`，命中即把对应 `userId` 注入 `ctx`，业务 `protectedProcedure` 零改动即可被脚本调用。
- 错误文案区分「未登录」和「令牌无效/已失效」，方便脚本排查。

## 怎么用

```bash
# 1. 拿令牌
curl -X POST http://localhost:3000/api/trpc/apiAccessToken.generate \
  -H "Content-Type: application/json" \
  -d '{"json":{"username":"alice","password":"your-password"}}'
# → { "result": { "data": { "json": { "token": "awt_xxxx..." } } } }

# 2. 用令牌
curl -X POST http://localhost:3000/api/trpc/person.getMe \
  -H "Authorization: Bearer awt_xxxx..." \
  -H "Content-Type: application/json" \
  -d '{"json":null}'
```

要点：

- 令牌明文只返回一次，丢了/泄漏了 → 再调一次 `apiAccessToken.generate` 即可，旧的自动失效。
- Bearer **优先于** Session：同一请求两种凭证都在时，以 Bearer 解析出的用户为准。
- 携带 Bearer 不会创建/延长任何 Web 登录会话，响应不会写 `Set-Cookie`。
- 生成接口只认入参 `username`/`password`，单凭 Bearer 不能给自己续命。

更完整的调用示例与错误码说明见 [README.md](./README.md)。

## 模块结构

```
src/server/features/api-access-token/
├── domain/
│   ├── repositories/api-access-token-repository.ts   # 接口
│   └── services/
│       ├── token-generator.ts                        # 接口
│       └── token-hasher.ts                           # 接口
├── application/
│   └── generate-api-access-token-use-case.ts        # 校验密码 → 幂等签发
├── infrastructure/
│   ├── schema.ts                                     # user_api_tokens 表
│   ├── api-access-token-repository.ts                # upsert / findUserIdByHash
│   ├── crypto-token-generator.ts                     # awt_ + base64url(32B)
│   ├── sha256-token-hasher.ts                        # sha256 hex
│   └── index.ts                                      # 单例聚合
└── composition/
    ├── index.ts                                      # 装配 + 暴露给 router
    └── resolve-user-id-from-bearer.ts                # Authorization 头 → userId
```

边界改动只有三处：

- `src/server/lib/db/schema.ts` 追加 `export *`。
- `src/server/lib/trpc/routers/_app.ts` 挂载 `apiAccessToken` router；router 实现在 `src/server/lib/trpc/routers/api-access-token.ts`。
- `src/app/api/trpc/[trpc]/route.ts` + 抽出的 `context.ts`：`createContext` 里并行 `getServerSession` 与 `resolveUserIdFromBearer`，按 Bearer 优先合成 `userId`。

## 部署提醒

`user_api_tokens` 表的迁移需要在首次发布前手动执行 `npm run drizzle:push`（已写入 [4-task.md](./4-task.md) 任务 1.2，本阶段未自动化）。
