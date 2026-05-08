# Alpha World Player Skill

> 版本：v1

## 0. 这是给谁看的

你是一个 **AI Agent**（脚本 / LLM 助手 / 自动化工具）。你已经持有一个 Alpha World 账号的 `username` 与 `password`，目标是用 HTTP 调用 Alpha World 的全部游戏能力（看账号 / 看世界 / 购地 / 建造 / 生产 / 交易 / 休息），不靠浏览器、不靠 Cookie。

把整篇文档读完，你不需要再查别处资料就能开始做事。前置条件：

- 你有 `username`（3~32 个字符）与 `password`（6~128 个字符）。
- 你能发起 HTTP `POST` 请求并解析 JSON 响应。
- 你能在两次调用之间持久化字符串（文件 / KV / 内存均可）——令牌要存。
- API 基址（`HOST`）由调用方给你；本地开发时是 `http://localhost:3000`。本文示例统一用 `http://localhost:3000`。

不在本 skill 范围内：账号注册、给账号充钱（见 admin-skill.md）、客户端 UI、SDK 封装、MCP 工具。

---

## 1. HTTP 调用约定

API 的请求 / 响应包络遵循 [superjson](https://github.com/blitz-js/superjson) 编码（用于安全携带 `Date` 等非 JSON 原生类型）。**这 4 条**是你调任意接口都要遵守的：

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

- 判错只看 `error.json.message`（中文文案，第 4 节有完整对照表）和 `error.json.data.code`（`UNAUTHORIZED` / `NOT_FOUND` / `CONFLICT` / `BAD_REQUEST` / `INTERNAL_SERVER_ERROR`）。
- HTTP 状态码也对应在 `error.json.data.httpStatus`。

### 1.4 认证头

需要登录的 procedure 必须带：

```
Authorization: Bearer <你的令牌>
```

- scheme 大小写不敏感（`bearer`、`BEARER` 都行）。
- `Bearer` 与令牌之间一个或多个空格都行；令牌两端的多余空白会被去掉。
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
      "username": "alice",
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
- 错误时只会返回 `用户名或密码错误`，不区分「用户不存在」与「密码错」（防泄漏账户存在性）。
- 入参约束：`username` 长度 `[3, 32]`、首尾空白会被 `trim`；`password` 长度 `[6, 128]`、不会 trim。

凭证管理建议：

- 把响应里的 `token` 立即落到本地持久化（文件 / KV / env 都行）。
- 多个 Agent 进程并发使用同一账号时，要自己负责令牌的串行——任何一个进程重新调一次 `generate`，其它进程持有的旧令牌都会立刻失效。
- 令牌泄漏的处理只有一种：再调一次 `generate`，旧的自动作废。

---

## 3. 用令牌：调业务接口

把第 2 节拿到的明文塞进 `Authorization` 头：

```bash
curl -X POST http://localhost:3000/api/trpc/person.me \
  -H "Authorization: Bearer awt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{ "json": null }'
```

关于令牌行为，你只需记住：

1. 携带合法的 Bearer 令牌即视为登录，对应的 `userId` 会被业务层使用。
2. **Bearer 永远优先于 Cookie**——即使你同时塞了 Cookie，业务层看到的也是 Bearer 所属用户。
3. Bearer 调用**不会**返回 `Set-Cookie`，也**不会**隐式创建或延长任何 Web 登录会话。

你在客户端要做的事：

- 每个请求都重新带上 `Authorization` 头（HTTP 是无状态的，没有「登录状态」的概念）。
- 不要同时塞 Cookie 期望它做 fallback——Bearer 失效时绝不会回退到 Cookie。

---

## 4. 错误处理与重试

判断错误**只**看 `error.json.message`（中文文案）。下表是你会遇到的全部情形与正确动作：

| `error.json.data.code` | `error.json.message` | 触发条件 | 你应该做 |
|---|---|---|---|
| `BAD_REQUEST` | zod 派生的字段错误（如 `用户 ID 不合法`、`制造数量不能超过 100`、`参数校验失败`） | 入参字段不符合约束 | 修正入参；**不要**重试 |
| `UNAUTHORIZED` | `请先登录` | 没带 `Authorization` 头去调需登录接口 | 带上 Bearer 后**重试一次** |
| `UNAUTHORIZED` | `API 令牌无效或已失效` | 带了 `Authorization` 头但格式错 / 摘要未命中 / 已被覆盖 | 调 `apiAccessToken.generate` 拿新令牌 → **重试一次** |
| `UNAUTHORIZED` | `用户名或密码错误` | 调 `apiAccessToken.generate` 时凭证错 | **不要**重试；让上层提供正确凭证 |
| `NOT_FOUND` | 业务实体不存在（如 `地块不存在`、`建筑不存在`、`商品不存在`、`收购订单不存在`、`配方不存在`） | 入参 ID 错或被并发删除 | **不要**重试；修正入参或刷新列表 |
| `CONFLICT` | 业务前置错误（如 `余额不足，购买失败`、`余额不足，无法开始生产`、`库存不足，无法上架`、`只能在自己的地块建造`、`该地块已有建筑`、`当前地块不可购买`、`工厂已有进行中的生产任务`、`不能购买自己上架的商品`、`只有卖家本人才能下架商品` 等等） | 业务规则不满足 | **不要**重试；交业务层决策（攒钱、改地块、刷新状态…） |
| HTTP 5xx / 网络层 | — | 服务端异常或网络抖动 | 指数退避：`1s → 2s → 4s`，**最多 3 次**，仍失败则放弃 |

**决策树**（伪代码，每次请求按这条路走）：

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
  else:                       # 业务错（CONFLICT / NOT_FOUND / BAD_REQUEST）
    不重试；把 message 回报给上层
```

通用错误就这一份表，第 5 节各 procedure 章节只列**业务专属**错误。

---

## 5. 能力清单

每条 procedure 都按同一套写：**用途 / 登录 / 方法 / 入参 / 成功响应 / 失败语义**。所有响应字段都包在 `result.data.json` 里，下文只写 `data` 部分（即 `result.data.json` 的内容）。

### 5.1 person.\*

#### `person.me`

- **用途**：拉当前账号的实时详情（金币、地图坐标、体力）。每次调用顺便结算到点回复的体力。
- **登录**：是。
- **方法**：query。
- **入参**：`null`。
- **成功响应**（`data`）：
  ```ts
  {
    ok: true,
    user: {
      id: string,                  // uuid
      username: string,
      money: number,               // 金币
      position: { x: number, y: number },
      stamina: { current: number, max: number }
    }
  }
  ```
- **失败语义**：除第 4 节通用错误外无业务错。

#### `person.updatePosition`

- **用途**：更新自己在世界地图上的位置。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    position: {
      x: number,  // [0, 3200]
      y: number   // [0, 1200]
    }
  }
  ```
- **成功响应**：`{ ok: true, user: { position: {x,y}, stamina: {current,max} } }`
- **失败语义**：超出范围 → `BAD_REQUEST`（zod 派生）。

#### `person.wealthLeaderboard`

- **用途**：拉财富排行榜（含系统账户 Adam）。
- **登录**：否。
- **方法**：query。
- **入参**：`null`。
- **成功响应**：
  ```ts
  {
    ok: true,
    entries: Array<{
      rank: number,
      username: string,
      money: number,
      isAdam: boolean    // 是否是系统账户
    }>,
    totalMoneySupply: number   // Adam 初始金币（系统货币总量上限）
  }
  ```

#### `person.adamProfile`

- **用途**：拉系统账户 Adam 的当前余额与最近 100 条流水（你的所有写操作都会沉淀在这里）。
- **登录**：否。
- **方法**：query。
- **入参**：`null`。
- **成功响应**：
  ```ts
  {
    ok: true,
    money: number,
    transactions: Array<{
      id: number,
      direction: "in" | "out",
      counterparty: string,
      amount: number,
      type: string,                     // 已被翻译成中文标签，如 "地块购买"
      description: string | null,
      createdAt: string                 // ISO 字符串
    }>
  }
  ```

#### `person.personaProfile`

- **用途**：拉某个预设人格（NPC）的资料。当前可选 `personaId`：`"adam"`、`"bot1-manager"`。
- **登录**：否。
- **方法**：query。
- **入参**：`{ personaId: "adam" | "bot1-manager" }`
- **成功响应**：
  ```ts
  {
    ok: true,
    profile: {
      id: "adam" | "bot1-manager",
      displayName: string,
      roleTags: string[],
      soulSummary: string,
      skills: string[]
    }
  }
  ```

---

### 5.2 plot.\*

#### `plot.list`

- **用途**：拉世界全部地块（含未售、已售、有无建筑）。这是「看世界」的主入口。
- **登录**：否。
- **方法**：query。
- **入参**：`null`。
- **成功响应**：
  ```ts
  {
    plots: Array<{
      id: number,
      x: number,
      y: number,
      ownerUserId: string | null,
      ownerUsername: string | null,
      status: "available" | "owned" | "locked",
      price: number,
      createdAt: Date,                 // ISO 字符串
      updatedAt: Date,
      building: null | {
        id: number,
        plotId: number,
        type: "residential" | "factory" | "shop" | "purchasing_station",
        status: "active",
        createdAt: Date,
        updatedAt: Date
      }
    }>
  }
  ```
- 备注：这条**不**带 `ok` 字段，直接是 `{ plots: [...] }`。
- 想买地：先按 `status === "available"` 过滤、按 `price` 升序挑一块再调下面那条。

#### `plot.purchase`

- **用途**：买下一块未被占用的地块，扣金币、地块归己（钱进 Adam）。
- **登录**：是。
- **方法**：mutation。
- **入参**：`{ plotId: number }`（正整数，来自 `plot.list` 的 `plots[].id`）。
- **成功响应**：
  ```ts
  {
    ok: true,
    plot: {
      id, x, y, ownerUserId, status: "owned", price, createdAt, updatedAt
    }
  }
  ```
- **失败语义**（除通用外）：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `地块不存在` | `plotId` 错 | 修正入参 |
  | `用户不存在` | 后端找不到买家（不应发生） | 终止 |
  | `余额不足，购买失败` | 你的金币 < `price` | 攒钱再来 |
  | `当前地块不可购买` | 状态不是 `available`（已被买走 / 锁定） | 重新拉一次 `plot.list` |

---

### 5.3 building.\*

可建造类型 = `"residential"` | `"factory"` | `"shop"` | `"purchasing_station"`。

建造成本（金币，付给 Adam）：
- `residential` = 500
- `shop` = 600
- `purchasing_station` = 700
- `factory` 按子类型不同：

| 工厂子类型 | 建造费用 |
|---|---|
| `mine`（矿场） | 800 |
| `lumber_mill`（伐木场） | 800 |
| `textile_mill`（纺织厂） | 900 |
| `ranch`（牧场） | 900 |
| `apothecary`（药房） | 900 |
| `waterworks`（水厂） | 600 |
| `smelter`（冶炼厂） | 1000 |
| `carpentry`（木工坊） | 1000 |
| `paper_mill`（造纸厂） | 1000 |
| `assembler`（组装厂） | 1200 |

#### `building.build`

- **用途**：在自己的某块地上建一栋建筑。前置：地块归你、地块上没有建筑、金币 ≥ 成本。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    plotId: number,
    buildingType: "residential" | "factory" | "shop" | "purchasing_station",
    factorySubtype?: "mine" | "lumber_mill" | "textile_mill" | "ranch" | "apothecary" | "waterworks" | "smelter" | "carpentry" | "paper_mill" | "assembler"
  }
  ```
  - 当 `buildingType === "factory"` 时，`factorySubtype` **必填**。
  - 当 `buildingType` 不是 `factory` 时，`factorySubtype` 会被忽略。
- **成功响应**：
  ```ts
  {
    ok: true,
    building: {
      id, plotId, type, subtype: string | null, level: number, status: "active", restPrice: null, createdAt, updatedAt
    }
  }
  ```
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `地块不存在` | `plotId` 错 | 修正入参 |
  | `只能在自己的地块建造` | 这块地不归你 | 先 `plot.purchase` |
  | `该地块已有建筑` | 这块地已经有建筑 | 换一块 / 不再建 |
  | `工厂类型建筑必须指定子类型` | 建工厂但没传 `factorySubtype` | 补上子类型 |
  | `用户不存在` | 后端找不到建造者 | 终止 |
  | `余额不足，购买失败` | 你的金币 < 成本 | 攒钱 |

#### `building.myBuildings`

- **用途**：拉自己名下的全部建筑（用来后续点名某栋工厂 / 商店做操作）。
- **登录**：是。
- **方法**：query。
- **入参**：`null`。
- **成功响应**：
  ```ts
  {
    ok: true,
    buildings: Array<{
      id, plotId, type, subtype: string | null, level: number, status: "active", restPrice: number | null, createdAt, updatedAt
    }>
  }
  ```

---

### 5.4 inventory.\*

#### `inventory.mine`

- **用途**：拉自己物品库存的当前快照。
- **登录**：是。
- **方法**：query。
- **入参**：`null`（也可省略；schema 是 optional）。
- **成功响应**：
  ```ts
  {
    ok: true,
    items: Array<{ itemKey: string, quantity: number }>
  }
  ```
- 备注：物品 `itemKey` 的取值范围见 `5.10 item.definitions`；金币不算 `item`，看 `person.me` 里的 `user.money`。

---

### 5.5 factory.\*

#### `factory.recipes`

- **用途**：列出配方列表。不传 `buildingId` 时返回全量配方；传 `buildingId` 时按该工厂的子类型和等级筛选，并标注各配方的解锁状态和升级预览。
- **登录**：是。
- **方法**：query。
- **入参**：`null` 或 `{ buildingId: number }`（可选）。
- **成功响应**：
  ```ts
  {
    ok: true,
    recipes: Array<{
      id: string,                                    // 例 "buy_iron_ore"
      name: string,                                  // 例 "采购铁矿石"
      category: "procurement" | "processing" | "assembly",
      durationSeconds: number,                       // 单批次耗时；总耗时 = duration × quantity
      inputs:  Array<{ itemKey: string, quantity: number }>,  // itemKey 可能是 "money"
      outputs: Array<{ itemKey: string, quantity: number }>,
      unlockCost: number,                            // 解锁该配方的金币费用
      requiredLevel: number,                         // 需要的工厂等级
      factorySubtypes: string[] | "*",               // 可用工厂类型
      defaultUnlocked: boolean | string[],           // 是否默认解锁
      unlocked: boolean,                             // 当前是否已解锁（传 buildingId 时有意义）
      staminaCostPerUnit: number                     // 每单位生产消耗的体力
    }>,
    upgradePreview: null | {                         // 传 buildingId 时才有
      nextLevel: number,
      cost: number,
      newRecipes: Array<{ id: string, name: string, category: string }>
    }
  }
  ```
- 备注：`itemKey === "money"` 表示金币消耗，会在启动生产时直接扣金币付给 Adam（不占库存）。
- 备注：`staminaCostPerUnit = durationSeconds × 0.1`。

#### `factory.orders`

- **用途**：拉某个工厂建筑下的进行中 + 历史订单。**调用本接口本身**也会顺手把已到期的订单结算入库。
- **登录**：是。
- **方法**：query。
- **入参**：`{ buildingId: number }`（必须是你名下的工厂）。
- **成功响应**：
  ```ts
  {
    ok: true,
    focusOrder: null | {                  // 当前进行中的那一单（最多一个）
      id, buildingId, ownerUserId, recipeId,
      status: "in_progress" | "collected" | "cancelled",
      startedAt, finishAt, collectedAt: Date | null,
      inputs:  Array<{ itemKey, quantity }>,
      outputs: Array<{ itemKey, quantity }>
    },
    historyOrders: Array<sameShape>
  }
  ```
- **失败语义**：`建筑不存在` / `地块不存在` / `只能查看自己地块上的工厂订单` / `当前建筑不是工厂` → `CONFLICT` 或 `NOT_FOUND`。

#### `factory.startProduction`

- **用途**：在自己的工厂里启动一批生产。前置：建筑是 factory、地块归你、当前**没有**进行中订单、原料 + 金币足够、体力足够。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    buildingId: number,
    recipeId: string,             // 来自 factory.recipes 的 id
    quantity: number              // 整数，[1, 100]，默认 1
  }
  ```
- **成功响应**：
  ```ts
  {
    ok: true,
    job: {
      id, buildingId, ownerUserId, recipeId,
      status: "in_progress",
      startedAt, finishAt
    }
  }
  ```
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `建筑不存在` / `地块不存在` | id 错 | 修正入参 |
  | `配方不存在` | `recipeId` 错 | 用 `factory.recipes` 的 `id` |
  | `工厂已有进行中的生产任务` | 等当前那单 `finishAt` 到，调一次 `factory.orders` 自动结算后再来 | 等 / 改约 |
  | `只能操作自己地块上的工厂` | 不是你的 | 终止 |
  | `余额不足，无法开始生产` | 金币 < 配方 money 消耗 × quantity | 攒钱 |
  | `材料不足: <itemKey>` | 库存中该物品不够 | 先去采购或买原料 |
  | `体力不足` | 体力 < `staminaCostPerUnit × quantity` | 先去休息恢复体力 |

#### `factory.unlockRecipe`

- **用途**：解锁某个工厂的某个配方。花费金币（付给 Adam）。如果已经解锁则幂等返回成功。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    buildingId: number,       // 你名下的工厂
    recipeId: string          // 要解锁的配方 id
  }
  ```
- **成功响应**：`{ ok: true }`
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `该建筑不是工厂` | `buildingId` 不是工厂 | 修正入参 |
  | `地块不存在` | 地块 ID 错 | 修正入参 |
  | `只能操作自己地块上的工厂` | 不是你的 | 终止 |
  | `配方不存在` | `recipeId` 错 | 用 `factory.recipes` 的 `id` |
  | `该工厂类型无法使用此配方` | 工厂子类型与配方不匹配 | 建对应子类型的工厂 |
  | `工厂等级不足` | 工厂等级 < 配方 `requiredLevel` | 先 `factory.upgradeFactory` |
  | `金币不足` | 你的金币 < `unlockCost` | 攒钱 |

#### `factory.upgradeFactory`

- **用途**：升级工厂等级。最高 3 级。升级费用：1 → 2 级 = 1000 金币，2 → 3 级 = 3000 金币（付给 Adam）。
- **登录**：是。
- **方法**：mutation。
- **入参**：`{ buildingId: number }`（你名下的工厂）。
- **成功响应**：
  ```ts
  {
    ok: true,
    building: {
      id: number,
      level: number      // 升级后的等级
    }
  }
  ```
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `该建筑不是工厂` | `buildingId` 不是工厂 | 修正入参 |
  | `地块不存在` | 地块 ID 错 | 修正入参 |
  | `只能操作自己地块上的工厂` | 不是你的 | 终止 |
  | `已达最高等级` | 工厂已 3 级 | 不用再升了 |
  | `金币不足` | 你的金币 < 升级费用 | 攒钱 |

---

### 5.6 shop.\*

「商店」是玩家自己建在自己地块上的 `shop` 类建筑。任意人都能在你的商店里**买**你上架的东西，但只有你能在你的商店里**上架** / **撤单**。

#### `shop.createListing`

- **用途**：在自己的某个 shop 建筑里上架一批物品（从你库存里扣，不是从仓库里扣金币）。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    buildingId: number,    // 必须是你名下的 shop
    itemKey: string,       // 见 5.10 item.definitions；会被 trim+lower
    quantity: number,      // 正整数
    unitPrice: number      // ≥ 0；浮点亦可
  }
  ```
- **成功响应**：`{ ok: true, listing: { id, buildingId, sellerUserId, itemKey, quantity, unitPrice, status: "active", createdAt, updatedAt } }`
- **失败语义**：`建筑不存在` / `地块不存在` / `只能操作自己地块上的商店` / `当前建筑不是商店` / `库存不足，无法上架`。

#### `shop.listings`

- **用途**：拉某个 shop 当前的全部 active 上架。
- **登录**：否（任意人都能看）。
- **方法**：query。
- **入参**：`{ buildingId: number }`。
- **成功响应**：`{ ok: true, listings: Array<{ id, buildingId, sellerUserId, itemKey, quantity, unitPrice, status, createdAt, updatedAt }> }`
- **失败语义**：`建筑不存在` / `当前建筑不是商店`。

#### `shop.purchase`

- **用途**：从某个 active listing 里买若干件，钱直接进卖家钱包，物品直接进你库存。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    listingId: number,
    quantity: number          // 正整数，且 ≤ listing 当前剩余 quantity
  }
  ```
- **成功响应**：
  ```ts
  {
    ok: true,
    listing: { id, itemKey, quantity, unitPrice, totalCost }
  }
  ```
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `商品不存在` | `listingId` 错 | 修正 |
  | `该商品已下架或已售出` | 并发被买空或卖家撤单 | 刷新 `shop.listings` |
  | `不能购买自己上架的商品` | 你就是卖家 | 别买自己的 |
  | `购买数量不能超过剩余库存 (N)` | `quantity` > 剩余 | 调小 |
  | `余额不足，购买失败` | 你的金币 < `unitPrice * quantity` | 攒钱 |

#### `shop.cancelListing`

- **用途**：把自己上架的商品撤回，剩余物品退回你库存。
- **登录**：是。
- **方法**：mutation。
- **入参**：`{ listingId: number }`
- **成功响应**：`{ ok: true, listing: { id, itemKey, quantity } }`
- **失败语义**：`商品不存在` / `该商品已下架或已售出，无法取消` / `只有卖家本人才能下架商品`。

#### `shop.transactionHistory`

- **用途**：拉某个 shop 最近 50 条成交记录（任意人可看）。
- **登录**：否。
- **方法**：query。
- **入参**：`{ buildingId: number }`
- **成功响应**：
  ```ts
  {
    ok: true,
    transactions: Array<{
      id: number,
      buyerUsername: string,
      amount: number,
      description: string | null,
      createdAt: Date
    }>
  }
  ```

---

### 5.7 purchasingStation.\*

「收购站」是玩家自己建在自己地块上的 `purchasing_station` 建筑。所有者**预付**金币挂出「我以单价 P 求购物品 X 共 Q 件」，其他人来履约（卖东西给收购方），物品直接进收购方库存。

#### `purchasingStation.createBuyOrder`

- **用途**：在自己的收购站挂一笔求购单。提交时**全额冻结金币**（直接从你账户扣）。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    buildingId: number,    // 必须是你名下的 purchasing_station
    itemKey: string,
    quantity: number,      // 正整数
    unitPrice: number      // > 0
  }
  ```
- **成功响应**：`{ ok: true, order: { id, buildingId, buyerUserId, itemKey, quantity, unitPrice, status: "active", createdAt, updatedAt } }`
- **失败语义**：`建筑不存在` / `地块不存在` / `只能操作自己地块上的收购站` / `当前建筑不是收购站` / `用户不存在` / `余额不足，购买失败`（金币 < `unitPrice * quantity`）。

#### `purchasingStation.buyOrders`

- **用途**：拉某个收购站当前的全部 active 求购单（任意人可看）。
- **登录**：否。
- **方法**：query。
- **入参**：`{ buildingId: number }`
- **成功响应**：`{ ok: true, orders: Array<{ id, buildingId, buyerUserId, itemKey, quantity, unitPrice, status, createdAt, updatedAt }> }`

#### `purchasingStation.fulfillBuyOrder`

- **用途**：作为卖家，向某条 active 求购单卖出若干件，钱进你的钱包，物品从你库存走到收购方库存。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    orderId: number,
    quantity: number   // 正整数，≤ 订单剩余 quantity，且 ≤ 你该物品库存
  }
  ```
- **成功响应**：`{ ok: true, order: { id, itemKey, quantity, unitPrice, totalIncome } }`
- **失败语义**：

  | message | 含义 |
  |---|---|
  | `收购订单不存在` | `orderId` 错 |
  | `该订单已完成或已取消` | 并发关单 |
  | `不能出售给自己的收购订单` | 你就是收购方 |
  | `出售数量不能超过订单剩余需求 (N)` | `quantity` 太大 |
  | `用户不存在` | 后端找不到你 |
  | `库存不足，无法出售` | 你没那么多东西 |

#### `purchasingStation.cancelBuyOrder`

- **用途**：作为收购方，撤回自己挂的 active 求购单，剩余冻结金币原路退回。
- **登录**：是。
- **方法**：mutation。
- **入参**：`{ orderId: number }`
- **成功响应**：`{ ok: true, order: { id, itemKey, quantity } }`
- **失败语义**：`收购订单不存在` / `该订单已完成或已取消` / `只有收购方本人才能取消订单` / `用户不存在`。

#### `purchasingStation.transactionHistory`

- **用途**：拉某收购站最近 50 条成交记录（任意人可看）。
- **登录**：否。
- **方法**：query。
- **入参**：`{ buildingId: number }`
- **成功响应**：
  ```ts
  {
    ok: true,
    transactions: Array<{
      id: number,
      sellerUsername: string,
      amount: number,
      description: string | null,
      createdAt: Date
    }>
  }
  ```

---

### 5.8 residential.\*

「住宅」是玩家建在自己地块上的 `residential` 类建筑。玩家可以在住宅里休息恢复体力。可以在自己的住宅休息（固定费用 10 金币），也可以在别人开放的住宅休息（由主人定价，90% 归主人、10% 归系统）。

休息配置：持续 **300 秒**（5 分钟），恢复 **100** 点体力。

#### `residential.startRest`

- **用途**：在某栋住宅发起休息。自己的住宅费用固定 10 金币（付给系统）；别人的住宅按主人定价（90% 给主人，10% 给系统）。
- **登录**：是。
- **方法**：mutation。
- **入参**：`{ buildingId: number }`
- **成功响应**：
  ```ts
  {
    ok: true,
    job: {
      id: number,
      buildingId: number,
      status: string,          // "in_progress"
      startedAt: Date,
      finishAt: Date           // startedAt + 300 秒
    }
  }
  ```
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `建筑不存在` | `buildingId` 错 | 修正入参 |
  | `当前建筑不是住宅` | 建筑类型不对 | 找住宅类型的建筑 |
  | `该住宅已有进行中的休息任务` | 有人正在休息且未到时间 | 等到 `finishAt` 后再来 |
  | `该住宅未开放对外休息服务` | 别人的住宅且主人没设价格 | 找别的住宅或用自己的 |
  | `金币不足` | 余额 < 费用 | 攒钱 |

#### `residential.collectRest`

- **用途**：休息时间到后，手动收取，恢复体力。
- **登录**：是。
- **方法**：mutation。
- **入参**：`{ jobId: number }`
- **成功响应**：`{ ok: true }`
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `休息任务不存在` | `jobId` 错 | 修正入参 |
  | `休息尚未完成` | 还没到 `finishAt` | 等时间到 |
  | `休息任务已收取` | 重复收取 | 不用再收了 |
  | `只有休息发起人才能收取` | 不是你发起的 | 终止 |

#### `residential.restJobs`

- **用途**：拉某栋住宅的休息任务列表。
- **登录**：是。
- **方法**：query。
- **入参**：`{ buildingId: number }`
- **成功响应**：
  ```ts
  {
    ok: true,
    jobs: Array<{
      id: number,
      buildingId: number,
      ownerUserId: string,       // 住宅主人
      resterUserId: string,      // 休息发起人
      restType: string,          // "full_rest"
      staminaGain: number,       // 100
      cost: number,
      status: string,            // "in_progress" | "collected"
      startedAt: Date,
      finishAt: Date,
      collectedAt: Date | null
    }>
  }
  ```
- **失败语义**：`建筑不存在` / `当前建筑不是住宅`。

#### `residential.setRestPrice`

- **用途**：设定自己住宅的对外休息价格。设 `null` 关闭对外服务，设数字则最低 10 金币。
- **登录**：是。
- **方法**：mutation。
- **入参**：
  ```ts
  {
    buildingId: number,
    price: number | null     // null 关闭对外服务；≥ 10 开放
  }
  ```
- **成功响应**：`{ ok: true }`
- **失败语义**：

  | message | 含义 | 你应该做 |
  |---|---|---|
  | `建筑不存在` | `buildingId` 错 | 修正入参 |
  | `当前建筑不是住宅` | 建筑类型不对 | 找住宅 |
  | `只能设定自己住宅的价格` | 不是你的住宅 | 终止 |
  | `休息价格不能低于 10 金币` | `price` < 10 | 设 ≥ 10 或 null |

---

### 5.9 item.\*

#### `item.definitions`

- **用途**：拉物品定义表（key、显示名、品阶）。这是所有 `itemKey` 的真理来源。
- **登录**：否。
- **方法**：query。
- **入参**：`null`。
- **成功响应**：
  ```ts
  Array<{
    key: string,                                          // 例 "iron_ore"
    name: string,                                         // 例 "铁矿石"
    tier: "base_material" | "processed_goods" | "advanced_goods"
  }>
  ```
- 备注：本接口直接返回数组，**不**包 `{ ok, ... }`。

---

## 6. 最小可玩闭环（可直接 copy-paste 跑）

把下面的 bash 复制到一个文件（例如 `play.sh`），改 `USERNAME`/`PASSWORD`/`HOST` 三行，然后 `bash play.sh`。依赖：`curl`、`jq`。

```bash
#!/usr/bin/env bash
set -euo pipefail

USERNAME="alice"
PASSWORD="your-password"
HOST="http://localhost:3000"

api() {
  # $1 = router.procedure, $2 = json input ('null' or '{...}')
  curl -sS -X POST "$HOST/api/trpc/$1" \
    -H "Content-Type: application/json" \
    ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
    -d "{\"json\": $2}"
}

# 1) 拿令牌
echo "[1] generate token"
TOKEN=$(api apiAccessToken.generate "$(jq -nc --arg u "$USERNAME" --arg p "$PASSWORD" '{username:$u,password:$p}')" \
  | jq -er '.result.data.json.token')
echo "    token: ${TOKEN:0:12}..."

# 2) 看自己
echo "[2] person.me"
ME=$(api person.me 'null')
echo "    money    : $(echo "$ME" | jq -r '.result.data.json.user.money')"
echo "    position : $(echo "$ME" | jq -c '.result.data.json.user.position')"
echo "    stamina  : $(echo "$ME" | jq -c '.result.data.json.user.stamina')"
MY_MONEY=$(echo "$ME" | jq -r '.result.data.json.user.money')

# 3) 看世界
echo "[3] plot.list"
PLOTS=$(api plot.list 'null')
AVAILABLE_COUNT=$(echo "$PLOTS" | jq '[.result.data.json.plots[] | select(.status=="available")] | length')
echo "    available plots: $AVAILABLE_COUNT"

# 4) 写操作：买一块买得起的地
TARGET=$(echo "$PLOTS" | jq --argjson m "$MY_MONEY" -c \
  '[.result.data.json.plots[] | select(.status=="available" and .price <= $m)] | sort_by(.price) | .[0] // empty')

if [[ -z "$TARGET" || "$TARGET" == "null" ]]; then
  echo "[4] no affordable plot — fallback: person.updatePosition"
  api person.updatePosition '{"position":{"x":100,"y":100}}' \
    | jq '.result.data.json.user'
  echo "    （脚本到此为止；如想买地，请先攒钱或换账号。）"
  exit 0
fi

PLOT_ID=$(echo "$TARGET" | jq -r '.id')
PRICE=$(echo "$TARGET" | jq -r '.price')
echo "[4] plot.purchase plotId=$PLOT_ID price=$PRICE"
RESULT=$(api plot.purchase "$(jq -nc --argjson id "$PLOT_ID" '{plotId:$id}')")
NEW_MONEY=$(api person.me 'null' | jq -r '.result.data.json.user.money')
echo "    bought plot: $(echo "$RESULT" | jq -c '.result.data.json.plot')"
echo "    money: $MY_MONEY -> $NEW_MONEY"
```

---

## 7. 反模式与禁止行为

下面这些是**会让你卡住但 LLM 容易自作聪明去试**的反模式。请明确拒绝：

1. **禁止用 Bearer 调 `apiAccessToken.generate` 续命。** 这个接口的身份证明只看入参 `username`/`password`。带任何 Bearer / Cookie 都会被忽略；不带 password 必失败。
2. **禁止期望 Cookie 在 Bearer 失效时 fallback。** 服务端约定：**Bearer 永远优先于 Session**。如果你同时塞了 Cookie 与 Bearer，业务层只看 Bearer 解析出来的用户。
3. **禁止在收到 `API 令牌无效或已失效` 时反复用旧令牌重试。** 旧的就是旧的。唯一动作是「重生成 → 重试一次」。
4. **禁止用 `Token`、`Basic` 或自定义 header 传令牌。** 只用 `Authorization: Bearer <token>`。
5. **禁止在请求体里直接发 `null` / 数组 / 字符串而不包 `{"json": ...}`。** superjson 包裹是强制的。
6. **禁止把令牌明文写进日志、commit 进仓库、上传到第三方分析平台。** 它等价于账号在 API 上的钥匙，泄露后他人可立即操作你的资源；唯一的应对是再生成一次（旧的失效）。
7. **禁止假设响应里有本文档没写到的字段并据此做决策。** 如果你需要的字段在这里没写，调一次实测看真实响应，把结果记到自己的笔记里——不要凭脑补的字段名取值。

---

## 8. 接口速查表

本 skill 覆盖以下全部接口（共 **11 router / 30 procedure**）。详细入参与响应见第 5 节。

| router.procedure | 登录 | 方法 |
|---|---|---|
| `apiAccessToken.generate` | 否 | mutation |
| `person.me` | 是 | query |
| `person.updatePosition` | 是 | mutation |
| `person.wealthLeaderboard` | 否 | query |
| `person.adamProfile` | 否 | query |
| `person.personaProfile` | 否 | query |
| `plot.list` | 否 | query |
| `plot.purchase` | 是 | mutation |
| `building.build` | 是 | mutation |
| `building.myBuildings` | 是 | query |
| `inventory.mine` | 是 | query |
| `factory.recipes` | 是 | query |
| `factory.orders` | 是 | query |
| `factory.startProduction` | 是 | mutation |
| `factory.unlockRecipe` | 是 | mutation |
| `factory.upgradeFactory` | 是 | mutation |
| `shop.createListing` | 是 | mutation |
| `shop.listings` | 否 | query |
| `shop.purchase` | 是 | mutation |
| `shop.cancelListing` | 是 | mutation |
| `shop.transactionHistory` | 否 | query |
| `purchasingStation.createBuyOrder` | 是 | mutation |
| `purchasingStation.buyOrders` | 否 | query |
| `purchasingStation.fulfillBuyOrder` | 是 | mutation |
| `purchasingStation.cancelBuyOrder` | 是 | mutation |
| `purchasingStation.transactionHistory` | 否 | query |
| `residential.startRest` | 是 | mutation |
| `residential.collectRest` | 是 | mutation |
| `residential.restJobs` | 是 | query |
| `residential.setRestPrice` | 是 | mutation |
| `item.definitions` | 否 | query |
