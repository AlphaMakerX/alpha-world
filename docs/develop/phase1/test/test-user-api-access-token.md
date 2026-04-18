# 测试规格：API 访问令牌的生成

> 对应 Proposal：[../1-proposal.md](../1-proposal.md)；Design：[../2-design.md](../2-design.md)

本规格针对 `apiAccessToken.generate`（tRPC `publicProcedure.mutation`）以及其所依赖的用例 / 持久化行为。身份证明只接受入参 `{username, password}`；任何 Web 会话或 Bearer 均不参与此接口的身份判定。

## 凭正确用户名 + 密码生成

- 当提供现有用户的正确用户名与密码时，应在本次响应中返回一个以 `awt_` 为前缀的非空字符串令牌，且其 SHA-256 摘要恰好是该用户在 `user_api_tokens` 表中此刻的 `token_hash`。
- 响应体**不得**包含除明文令牌之外的其他令牌副本（不得泄漏摘要、不得回显历史令牌）。
- 多次调用同一用户名+密码，每次都应返回一个新的明文，且每次调用后 `user_api_tokens` 里该 `user_id` 的 `token_hash` 被覆盖为新值（旧摘要不再存在于表中）。

## 凭证错误的失败语义

- 当提供不存在的用户名时，应失败，且失败响应与「用户存在但密码错误」的失败响应在错误码、错误文案、HTTP 状态上**完全一致**（不泄漏账户存在性）。
- 当提供存在的用户名但密码错误时，应失败，`user_api_tokens` 表对该用户的行不得被新增或改动。
- 上述失败语义应与 `executeLoginUserUseCase` 的现有失败语义保持同形。

## 请求身份来源的隔离

- 当调用方同时携带了 Web 登录 Cookie 会话但 `password` 字段为空或错误时，应失败——Session 不得被用作此接口的身份证明。
- 当调用方同时携带了有效的 `Authorization: Bearer <token>` 但 `password` 字段为空或错误时，应失败——Bearer 不得被用作此接口的身份证明。
- 当 `username`/`password` 正确，无论是否同时携带任何 Session / Bearer，均应成功且签发的令牌归属于 `username` 对应的用户（而非 Session / Bearer 解析出的用户）。

## 幂等覆盖即旧令牌失效

- 调用成功后，拿到的旧明文令牌用作 `Authorization: Bearer` 访问任一受保护业务 procedure，应成功。
- 再次以同样的用户名+密码调用生成接口后，上一步拿到的旧明文用作 `Authorization: Bearer` 访问同一受保护业务 procedure，应失败，错误应可区分「令牌无效 / 已失效」。
- 新返回的明文用作 `Authorization: Bearer` 访问同一业务 procedure，应成功。

## 明文不落库 / 不回显

- 在任意一次成功响应之后，不存在任何查询接口、任何日志字段能够重新取回已签发的明文令牌（只存在摘要）。
- `user_api_tokens` 表结构中不存在明文列。
