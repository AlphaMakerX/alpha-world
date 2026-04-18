# 开发计划（摘要）

1. **Phase 1 — API Access Token**：提供一个凭「用户名 + 密码」幂等生成 API 访问令牌的接口（再次生成即作废旧的），使无 Cookie 场景（脚本、自动化、后续 Skill）能以该用户身份调用后端业务能力。详细业务需求见 [Phase 1 规格：proposal](./phase1/1-proposal.md)。
2. **Phase 2 — 对外 Skill**：基于 Phase 1 的令牌，提供可复用的接口说明与调用指引（待 Phase 1 完成后再开规格）。
