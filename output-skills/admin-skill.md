# Alpha World Admin Skill

> 版本：v1

## 0. 这是给谁看的

你是一个**管理员 / 运维 Agent**（脚本 / LLM 助手 / 自动化工具）。你的目标是通过 HTTP 调用 Alpha World 的管理能力：**注册 bot 账号**、**给账号转账**。

把整篇文档读完，你不需要再查别处资料就能开始做事。前置条件：

- 你有一个管理员账号的 `username`（3~32 个字符）与 `password`（6~128 个字符）。
- 你能发起 HTTP `POST` 请求并解析 JSON 响应。
- 你能在两次调用之间持久化字符串（文件 / KV / 内存均可）——令牌要存。
- API 基址（`HOST`）由调用方给你；本地开发时是 `http://localhost:3000`。本文示例统一用 `http://localhost:3000`。

---

## 1. HTTP 调用约定

API 的请求 / 响应包络遵循 [superjson](https://github.com/blitz-js/superjson) 编码。**这 4 条**是你调任意接口都要遵守的：

### 1.1 HTTP 入口

```
POST http://localhost:3000/api/trpc/<router>.<procedure>
```

- 方法永远是 `POST`，**不**用 `GET`，即使是 query。
- `<router>.<procedure>` 见第 5 节「能力清单」。

### 1.2 请求体永远用 superjson 包裹

```json
{ "json": <你的入参> }
```

- 没有入参时也要写 `{ "json": null }`，**不要**只发 `null` 或空 body。
- 入参是对象就直接放在 `json` 字段里，例如 `{ "json": { "username": "alice", "password": "..." } }`。

### 1.3 响应体形状

成功：

```json
{
  "result": {
    "data": {
      "json": <返回值>,
      "meta": { "values": { ... } }
    }
  }
}
```

- 你要的实际值在 `result.data.json`。
- `meta` 是 superjson 标注哪些字段是 `Date` 等非 JSON 原生类型用的，你大多数时候只需要把这些字段当 ISO 时间戳字符串处理即可。

失败：

```json
{
  "error": {
    "json": {
      "message": "<给你看的中文文案>",
      "code": -32600,
      "data": {
        "code": "UNAUTHORIZED",
        "httpStatus": 401,
        "path": "<router>.<procedure>"
      }
    }
  }
}
```

- 判错只看 `error.json.message`（中文文案）和 `error.json.data.code`（`UNAUTHORIZED` / `NOT_FOUND` / `CONFLICT` / `BAD_REQUEST` / `INTERNAL_SERVER_ERROR`）。

### 1.4 认证头

需要登录的 procedure 必须带：

```
Authorization: Bearer <你的令牌>
```

- scheme 大小写不敏感（`bearer`、`BEARER` 都行）。
- 公开（不需要登录）的 procedure 可以不带这个头；带了也无副作用。
- **不要**用 `Token`、`Basic` 或自定义 header。

---

## 2. 拿令牌：`apiAccessToken.generate`

这是你进入系统的**唯一入口**。它的身份证明**只**接受入参里的 `username` + `password`，不接受 Cookie、不接受 Bearer。

```bash
curl -X POST http://localhost:3000/api/trpc/apiAccessToken.generate \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "username": "admin",
      "password": "your-password"
    }
  }'
```

成功响应：

```json
{
  "result": {
    "data": {
      "json": { "token": "awt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
    }
  }
}
```

**关键约束**：

- 明文令牌**只在这一次响应里**返回。服务端只存 SHA-256 摘要，没有任何接口能再回显明文——丢了就重新生成。
- 同一账号每次成功生成都会**覆盖**之前那把令牌。旧明文在 upsert 完成的瞬间就废了。
- 错误时只会返回 `用户名或密码错误`，不区分「用户不存在」与「密码错」。
- 入参约束：`username` 长度 `[3, 32]`、首尾空白会被 `trim`；`password` 长度 `[6, 128]`、不会 trim。

---

## 3. 能力清单

### 3.1 注册账号：`auth.register`

- **用途**：注册一个新账号（适用于创建 bot 账号）。新用户自动从系统账户 Adam 获得 **10,000** 金币。
- **登录**：否（公开接口）。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    username: string,   // 3~32 位，首尾空白会被 trim
    password: string    // 6~128 位
  }
  ```
- **成功响应**（`data`）：
  ```ts
  {
    user: {
      id: string,       // uuid
      username: string
    }
  }
  ```
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `用户名已存在` | 用户名重复 | 换一个用户名 |
  | `该用户名为系统保留名称` | 尝试注册 `adam` 等系统保留名 | 换一个用户名 |
  | `用户名至少 3 位` / `用户名最多 32 位` | 长度不符 | 修正入参 |
  | `密码至少 6 位` / `密码最多 128 位` | 长度不符 | 修正入参 |

- **示例**：
  ```bash
  curl -X POST http://localhost:3000/api/trpc/auth.register \
    -H "Content-Type: application/json" \
    -d '{
      "json": {
        "username": "my-bot-001",
        "password": "bot-secure-password"
      }
    }'
  ```

### 3.2 转账：`finance.transfer`

- **用途**：从当前认证用户向指定用户转账金币。适合给新注册的 bot 账号注入启动资金。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    toUsername: string,       // 收款人用户名，3~32 位
    amount: number,          // 正数，转账金额
    description?: string     // 可选，最多 200 字，备注
  }
  ```
- **成功响应**（`data`）：
  ```ts
  {
    ok: true,
    transfer: {
      fromUsername: string,
      toUsername: string,
      amount: number
    }
  }
  ```
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `收款用户不存在` | `toUsername` 找不到 | 修正用户名或先注册 |
  | `不能转账给自己` | 付款方和收款方是同一人 | 换一个收款人 |
  | `余额不足，转账失败` | 你的金币 < `amount` | 减少金额或充值 |

- **示例**：
  ```bash
  curl -X POST http://localhost:3000/api/trpc/finance.transfer \
    -H "Authorization: Bearer awt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
    -H "Content-Type: application/json" \
    -d '{
      "json": {
        "toUsername": "my-bot-001",
        "amount": 100000,
        "description": "bot 启动资金"
      }
    }'
  ```

---

## 4. 错误处理与重试

判断错误**只**看 `error.json.message`（中文文案）：

| `error.json.data.code` | `error.json.message` | 触发条件 | 你应该做 |
|---|---|---|---|
| `BAD_REQUEST` | zod 派生的字段错误 | 入参字段不符合约束 | 修正入参；**不要**重试 |
| `UNAUTHORIZED` | `请先登录` | 没带 `Authorization` 头去调需登录接口 | 带上 Bearer 后**重试一次** |
| `UNAUTHORIZED` | `API 令牌无效或已失效` | Bearer 格式错 / 摘要未命中 / 已被覆盖 | 调 `apiAccessToken.generate` 拿新令牌 → **重试一次** |
| `UNAUTHORIZED` | `用户名或密码错误` | 调 `apiAccessToken.generate` 时凭证错 | **不要**重试；让上层提供正确凭证 |
| `NOT_FOUND` | 业务实体不存在 | 入参 ID 错或并发删除 | **不要**重试；修正入参 |
| `CONFLICT` | 业务规则不满足 | 如余额不足、用户名已存在 | **不要**重试；交业务层决策 |
| HTTP 5xx / 网络层 | — | 服务端异常或网络抖动 | 指数退避：`1s → 2s → 4s`，**最多 3 次** |

**决策树**（伪代码）：

```
收到错误：
  if 网络错 or HTTP 5xx:
    退避 1s/2s/4s 重试，最多 3 次
  elif message == "API 令牌无效或已失效":
    重生成令牌 → 重试一次
  elif message == "请先登录":
    带上 Bearer → 重试一次
  elif message == "用户名或密码错误":
    停止；要求人介入更正凭证
  else:
    不重试；把 message 回报给上层
```

---

## 5. 快速上手：注册 bot 并转账

```bash
#!/usr/bin/env bash
set -euo pipefail

ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin-password"
BOT_USERNAME="my-bot-001"
BOT_PASSWORD="bot-password"
TRANSFER_AMOUNT=100000
HOST="http://localhost:3000"

api() {
  curl -sS -X POST "$HOST/api/trpc/$1" \
    -H "Content-Type: application/json" \
    ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
    -d "{\"json\": $2}"
}

# 1) 管理员拿令牌
echo "[1] 管理员获取令牌"
TOKEN=$(api apiAccessToken.generate "$(jq -nc --arg u "$ADMIN_USERNAME" --arg p "$ADMIN_PASSWORD" '{username:$u,password:$p}')" \
  | jq -er '.result.data.json.token')
echo "    token: ${TOKEN:0:12}..."

# 2) 注册 bot 账号
echo "[2] 注册 bot 账号: $BOT_USERNAME"
REGISTER_RESULT=$(api auth.register "$(jq -nc --arg u "$BOT_USERNAME" --arg p "$BOT_PASSWORD" '{username:$u,password:$p}')")
echo "    result: $(echo "$REGISTER_RESULT" | jq -c '.result.data.json')"

# 3) 给 bot 转账
echo "[3] 向 $BOT_USERNAME 转账 $TRANSFER_AMOUNT 金币"
TRANSFER_RESULT=$(api finance.transfer "$(jq -nc --arg u "$BOT_USERNAME" --argjson a "$TRANSFER_AMOUNT" '{toUsername:$u,amount:$a,description:"bot 启动资金"}')")
echo "    result: $(echo "$TRANSFER_RESULT" | jq -c '.result.data.json')"

echo "完成！bot 账号 $BOT_USERNAME 已就绪。"
```

---

## 6. 反模式与禁止行为

1. **禁止用 Bearer 调 `apiAccessToken.generate` 续命。** 这个接口的身份证明只看入参 `username`/`password`。
2. **禁止在收到 `API 令牌无效或已失效` 时反复用旧令牌重试。** 唯一动作是「重生成 → 重试一次」。
3. **禁止用 `Token`、`Basic` 或自定义 header 传令牌。** 只用 `Authorization: Bearer <token>`。
4. **禁止在请求体里直接发 `null` / 数组 / 字符串而不包 `{"json": ...}`。** superjson 包裹是强制的。
5. **禁止把令牌明文写进日志、commit 进仓库、上传到第三方分析平台。**
6. **禁止假设响应里有本文档没写到的字段并据此做决策。**

---

## 7. 接口速查表

| router.procedure | 登录 | 方法 | 用途 |
|---|---|---|---|
| `apiAccessToken.generate` | 否 | mutation | 用户名密码获取 token |
| `auth.register` | 否 | mutation | 注册新账号（含 bot） |
| `finance.transfer` | 是 | mutation | 向指定用户转账金币 |
