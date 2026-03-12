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


## 流程
1. 用户进入，直接看到地图
2. 当用户点击购买操作时，弹出登录，注册的框
3. 


## 功能点
1. 用户名密码注册
2. 用户名密码登录
3. phaser 画道路
4. phaser 画地块，并加载数据库地块及建筑信息


## todo
1. 用户在自己的地块，建造建筑
2. 建筑有 住宅，工厂，商店 3种
