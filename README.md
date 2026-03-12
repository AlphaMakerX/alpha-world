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
1. [x] 初始化 Next.js + TypeScript 项目结构（App Router）
2. [x] 集成并配置 tRPC、Ant Design、Tailwind CSS
3. [x] 接入 NextAuth.js，完成注册/登录基础流程
4. [x] 设计并创建数据库基础表（用户、地块、建筑）
5. [x] 使用 drizzle-orm 完成数据库连接与迁移
6. 完成用户注册接口与页面交互
7. 完成用户登录接口与页面交互
8. 实现地图首页展示（未登录可浏览）
9. 实现购买操作触发登录/注册弹窗
10. 使用 Phaser 绘制道路与地块基础地图
11. 加载数据库中的地块与建筑数据到 Phaser 场景

## 数据库基础表

- Drizzle Schema：`src/server/lib/db/schema.ts`
- Drizzle 配置：`drizzle.config.ts`
- Drizzle 迁移目录：`drizzle/`
- 包含表：`users`、`plots`、`buildings`
- 生成迁移：`npm run db:generate`
- 执行迁移：`npm run db:migrate`
