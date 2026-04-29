# 开发计划

> 最后更新: 2026-04-29

## 已完成阶段

### Phase 1 — API Access Token

提供凭「用户名 + 密码」幂等生成 API 访问令牌的接口，使无 Cookie 场景（脚本、自动化）能以该用户身份调用后端业务能力。详见 [phase1/README.md](./phase1/README.md)。

### Phase 3 — 制造稀缺性：工厂配方解锁与专业化分工

通过工厂类型化（10 种子类型）、配方付费解锁、工厂三级升级系统，打破「一座工厂生产一切」的自给自足局面，迫使玩家通过交易协作。186 项单元测试全部通过。详见 [phase3/README.md](./phase3/README.md)。

## 待实施阶段

### Phase 2 — 对外 Skill

基于 Phase 1 的令牌，产出一份给第三方 AI Agent 看的 API 玩法手册（单文件 Markdown），不改服务端代码。详见 [phase2/README.md](./phase2/README.md)。

### Phase 4 — 代码重构：可读性与解耦

Phase 3 引入大量业务复杂度后，代码库出现大文件、跨模块耦合、重复模式、臃肿依赖注入等问题。本阶段聚焦在不改变外部行为的前提下进行结构优化。详见 [phase4/README.md](./phase4/README.md)。

### Phase 5 — 完善体力系统

让体力成为有意义的游戏资源：生产消耗体力（按配方时长 × 0.1），住宅新增「休息」功能恢复体力（花费金币 + 等待时间），前端展示体力条。详见 [phase5/README.md](./phase5/README.md)。

## 未来路线图

按优先级排列：

### P0 — Bug 修复与部署

- **位置同步 Bug**：玩家坐标 2s 同步导致刷新后回到旧坐标。方案：关键操作前立即同步 + beforeunload 发送最终坐标
- **页面状态刷新**：金钱和背包在操作后不能及时刷新。方案：mutation onSuccess 精确 invalidate
- **生产环境部署**：Vercel / 自建 + 云 PostgreSQL + CI/CD

### P1 — 核心玩法增强

- **邮箱系统**：统一物品/金钱流转中转，新增 mailbox bounded context

### P2 — 游戏体验优化

- **世界地图组件重构**：拆分子组件，抽取 hooks，Phaser 与 React 解耦
- **UI 体验提升**：背包网格化、配方树展示、移动端适配
- **Loading 与错误处理**：全局 loading skeleton、tRPC error boundary

### P3 — 社交与经济深化

- 多人实时交互（WebSocket/SSE）
- 聊天系统
- 排行榜与成就
- 动态市场价格、税收系统、拍卖行
