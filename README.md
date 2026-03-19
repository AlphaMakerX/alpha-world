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

 1. 邮箱建筑功能 有必要吗：只是为了页面正确刷新（金钱和背包物品）（我定时刷和手动刷也能成功）
- 可以给别人邮寄物品，金钱
- 生产的东西都会先寄到邮箱，点击后才存入背包
- 商店物品购买后
    - 1.邮寄金钱给商店主人
    - 2.邮寄物品给购买的人
- 收购站，提交后
    -1. 邮寄金钱给用户
    -2. 邮寄物品给收购站主人

2. 增加更多物品，拓展可玩性 
3. 增加人物坐标，下次上线可以出现到对应的坐标

4. adam 目标， 有一个配方，需要非常多的材料，然后制造获得一个开垦土地的徽章， adam 消耗这个徽章，就可以开垦一片土地

## todo
- 增加人物坐标
- 增加人物体力槽，恢复方式
- 增加物品分层体系：基础材料 → 加工品 → 高级品（例如木材→木板→家具）


- 制造数量 的输入框有bug,输入超过100的数有问题, 需要提示不能超过 100
- 当切换到远程数据库时，需要增加各种loading






