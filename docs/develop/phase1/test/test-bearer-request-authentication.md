# 测试规格：请求中的 Bearer 令牌鉴权

> 对应 Proposal：[../1-proposal.md](../1-proposal.md)；Design：[../2-design.md](../2-design.md)

本规格针对 tRPC HTTP handler 在 `createContext` 中对 `Authorization: Bearer <token>` 的解析，以及解析结果对 `ctx.userId` / `ctx.session` 的影响。

## 有效令牌访问受保护业务能力

- 当请求携带当前有效的 API 访问令牌、且不携带任何 NextAuth 会话 Cookie 时，调用一项既有 `protectedProcedure` 业务能力，应等价于该令牌所属用户通过 Web 登录成功后调用的结果。
- 当请求同时携带有效会话 Cookie 与有效 Bearer，且二者解析的用户一致时，调用受保护业务能力，应成功。

## 无效 / 已作废 / 格式异常的令牌

- 当请求携带格式符合 `awt_xxxx` 但 `user_api_tokens` 中不存在对应摘要的令牌，且无会话 Cookie 时，受保护业务能力应失败。
- 当请求携带已被"再次生成"覆盖掉的旧令牌，且无会话 Cookie 时，受保护业务能力应失败。
- 当请求携带完全无法解析的字符串（空值、乱码、超长串等）作为 Bearer，且无会话 Cookie 时，受保护业务能力应失败；服务端**不得**因异常输入而抛未捕获异常或 500。
- 当请求完全未携带 Bearer 也无会话 Cookie 时，受保护业务能力应以"未登录"语义失败。
- 以上四种失败场景，"令牌无效/已失效" 与 "未登录" 两类错误在调用方可感知层面必须**可区分**（例如错误码、error data 字段或错误消息差异），便于脚本排查是配置问题还是鉴权缺失。

## Bearer 与会话并存且冲突

- 当请求同时携带有效 Bearer（解析为用户 A）与有效会话 Cookie（解析为用户 B），且 A ≠ B 时，调用受保护业务能力的结果应等价于用户 **A** 发起（Bearer 优先）。此行为须与 Design 中写明的"Bearer 优先于 Session"唯一规则一致。

## 公开操作不被无效 Bearer 阻断

- 当调用 `auth.register`、`apiAccessToken.generate` 等 `publicProcedure` 时，即便请求同时携带无效或完全错误的 Bearer，也不得因 Bearer 校验失败而阻断这些公开流程的正常执行（Bearer 校验失败只影响身份解析结果，不影响公开过程的可达性）。

## Bearer 不创建 / 不延长 Web 登录会话

- 当请求仅携带有效 Bearer、不携带任何 NextAuth 会话 Cookie 时：
  - 服务端 `createContext` 内 `ctx.session` 应保持为 `null`（不伪造一个假的 session 对象）；
  - 响应头**不得**写回 `Set-Cookie` 去新建或刷新 `next-auth.session-token`；
  - 这意味着哪怕连续大量 Bearer 请求，后续浏览器访问也不会因此"被隐式登录"。

## 生成接口不接受 Bearer 作为身份证明

- 当请求仅携带有效 Bearer、不携带 `password` 字段，调用 `apiAccessToken.generate` 时，应失败（身份证明缺失），不得根据 Bearer 解析出的用户签发令牌。
- 当请求同时携带有效 Bearer 与正确的 `username`/`password` 时，签发结果应归属于 `username` 对应的用户（而非 Bearer 解析出的用户）。
