# Phase 2 测试索引

> 对应 Proposal：[1-proposal.md](./1-proposal.md)；Design：[2-design.md](./2-design.md)

本阶段无运行时代码，「测试」= 对 `skill/SKILL.md` 文档的可验证检查。分两类：

1. **结构性 / 静态对账**：人或脚本对 SKILL.md 的章节、覆盖范围、文案一致性的检查（不需要启动服务即可做）。
2. **行为性 / 端到端**：把 SKILL.md 喂给 Agent + 一个真实账号，验证它能否如 proposal 所要求那样跑通最小闭环、能否在令牌作废后自动恢复。

## 测试规格文件

| 文件 | 说明 | 主要覆盖目标 |
|------|------|--------------|
| [test-skill-structure.md](./test/test-skill-structure.md) | 静态对账：章节齐全、能力清单与源码 router 一对一、错误文案与源码一致、与 phase1/README.md 不冲突 | `docs/develop/phase2/skill/SKILL.md` |
| [test-skill-agent-behavior.md](./test/test-skill-agent-behavior.md) | 端到端：未读源码的 Agent 能否仅凭 SKILL.md 完成最小闭环 + 处理令牌失效 + 拒绝反模式 | `docs/develop/phase2/skill/SKILL.md` |

## 验收 Checklist

- [ ] `test-skill-structure.md` 中全部条目通过（人工或 `rg` 脚本核对）。
- [ ] `test-skill-agent-behavior.md` 中至少**一次**端到端演练通过——选定一个未读过本仓库源码的 LLM Agent，喂入 SKILL.md 与一对真实凭证，按规格描述操作。
- [ ] 演练中 Agent 完成 proposal 验收要求的最小可玩闭环（拿令牌 → 看自己 → 看世界 → 至少一次写操作）。
- [ ] 演练中故意作废 Agent 持有的令牌，Agent 能仅凭 SKILL.md 决策表自动恢复。
