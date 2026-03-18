# alpha world

- Next.js (App Router) + TypeScript
- tRPC + Ant Design + Tailwind CSS
- NextAuth.js
- Phaser
- drizzle-orm + pg

采用DDD开发模式

## 目录结构

```
docs/
src/
├── app/                            # 路由页面与 API Route
├── client/                         # 前端模块
│   ├── components/                 # 通用组件
│   ├── features/                   # 按业务拆分
│   │   └── auth/
│   └── lib/                        # 前端基础能力（如 trpc client）
└── server/                         # 后端模块
    ├── lib/
    │   ├── trpc/
    │   └── db/
    └── features/
        ├── auth/
        │   ├── application/
        │   └── infrastructure/
        ├── person/
        │   ├── application/
        │   ├── domain/
        │   └── infrastructure/
        ├── plot/
        ├── building/
        └── shared-kernel/
```


# feature

 邮箱功能
- 可以给别人邮寄物品，金钱
- 生产的东西都会先寄到邮箱，点击后才存入背包
- 购买，收购也需要，这样界面上的钱和物品才会实时刷新，需要打开邮件


## todo
- 把初始化系统的脚本重构一下，不应该直接去数据库操作，而是通过 usecase 
- 已购买和未购买的地块，做一下区别

## 环境变量

项目提供了示例文件：`.env.example`。

初始化系统账号时，以下变量为必填：

- `ADAM_INITIAL_PASSWORD`
- `BOT1_MANAGER_INITIAL_PASSWORD`

推荐流程：

1. 复制 `.env.example` 到 `.env.local`
2. 根据本地环境修改数据库与密钥配置
3. 执行 `npm run drizzle:push`
4. 执行 `npm run init:system`

