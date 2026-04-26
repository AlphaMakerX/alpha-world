# 开发计划（摘要）

1. **Phase 1 — API Access Token**（已完成）：提供一个凭「用户名 + 密码」幂等生成 API 访问令牌的接口（再次生成即作废旧的），使无 Cookie 场景（脚本、自动化、后续 Skill）能以该用户身份调用后端业务能力。规格见 [Phase 1 总览：README](./phase1/README.md)，实现总结见 [Phase 1 收尾：5-conclusion.md](./phase1/5-conclusion.md)。
2. **Phase 2 — 对外 Skill**（待开规格）：基于 Phase 1 的令牌，提供可复用的接口说明与调用指引。Phase 1 已经把「生成令牌 + 携带 Bearer 调用 tRPC」端到端打通（详见 [phase1/README.md](./phase1/README.md) 的「如何携带 Bearer 调用 tRPC」一节），Phase 2 不再需要对服务端做改动，只需以此为前置条件撰写文案与调用样例。
3. **Phase 3 — 制造稀缺性：工厂配方解锁与专业化分工**（已完成）：通过工厂类型化（10 种子类型）、配方付费解锁、工厂三级升级系统，打破「一座工厂生产一切」的自给自足局面，制造结构性的资源不对称，迫使玩家通过交易协作。新增 `factory_unlocked_recipes` 表、building 表新增 `subtype`/`level` 字段、配方元数据扩展（factorySubtypes/unlockCost/requiredLevel）。186 项单元测试全部通过。规格见 [Phase 3 总览：README](./phase3/README.md)。
4. **Phase 4 — 代码重构：可读性与解耦**（待实施）：Phase 3 引入大量业务复杂度后，代码库出现了大文件（recipe-catalog 982 行）、跨模块耦合（building → factory 自动解锁）、重复模式（transaction 记录分散）、臃肿的依赖注入等问题。本阶段聚焦于在不改变外部行为的前提下，拆分大文件、消除跨边界副作用、统一重复模式、简化组合层。规格见 [Phase 4 总览：README](./phase4/README.md)。
