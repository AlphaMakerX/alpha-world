# Phase 1：API Access Token（已完成）

为账号提供可再生的 API 访问令牌，使脚本/自动化在无 Cookie 下以用户身份调用 tRPC。

## 实现

- 新表 `user_api_tokens`：user_id 主键 + token_hash 唯一，每用户至多一把
- 新接口 `apiAccessToken.generate`：凭 username+password 幂等签发，明文只返回一次
- tRPC context 读 `Authorization: Bearer <token>`，SHA-256 命中即注入 ctx.userId
- Bearer 优先于 Session，不创建/延长 Web 会话

## 使用

```bash
# 生成令牌
curl -X POST http://localhost:3000/api/trpc/apiAccessToken.generate \
  -H "Content-Type: application/json" \
  -d '{"json":{"username":"alice","password":"your-password"}}'

# 用令牌调业务
curl -X POST http://localhost:3000/api/trpc/person.getMe \
  -H "Authorization: Bearer awt_xxxx..." \
  -H "Content-Type: application/json" \
  -d '{"json":null}'
```

- 令牌丢了/泄漏 → 再调 generate，旧的自动失效
- 生成接口只认 username+password，单凭 Bearer 不能续命

## 错误区分

| 场景 | message |
|------|---------|
| 未带任何凭证 | `请先登录` |
| Bearer 无效/已覆盖 | `API 令牌无效或已失效` |

## 模块

```
src/server/features/api-access-token/
├── domain/          # 仓储接口、token-generator、token-hasher 接口
├── application/     # generate-api-access-token-use-case
├── infrastructure/  # schema、repository、crypto 实现
└── composition/     # 装配 + resolve-user-id-from-bearer
```

测试：8 个文件，58 个用例全通过。
