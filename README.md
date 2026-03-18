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
- 增加一个邮箱的建筑，我可以给别人邮寄钱和各种物品
    - 商店里的物品



