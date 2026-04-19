# 开发计划（摘要）

1. **Phase 1 — API Access Token**（已完成）：提供一个凭「用户名 + 密码」幂等生成 API 访问令牌的接口（再次生成即作废旧的），使无 Cookie 场景（脚本、自动化、后续 Skill）能以该用户身份调用后端业务能力。规格见 [Phase 1 总览：README](./phase1/README.md)，实现总结见 [Phase 1 收尾：5-conclusion.md](./phase1/5-conclusion.md)。
2. **Phase 2 — 对外 Skill**（待开规格）：基于 Phase 1 的令牌，提供可复用的接口说明与调用指引。Phase 1 已经把「生成令牌 + 携带 Bearer 调用 tRPC」端到端打通（详见 [phase1/README.md](./phase1/README.md) 的「如何携带 Bearer 调用 tRPC」一节），Phase 2 不再需要对服务端做改动，只需以此为前置条件撰写文案与调用样例。
