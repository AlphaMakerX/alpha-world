# Phase 1 测试索引

> 对应 Proposal：[1-proposal.md](./1-proposal.md)；Design：[2-design.md](./2-design.md)

## 测试规格文件

| 文件 | 说明 | 主要覆盖源码 |
|------|------|--------------|
| [test-user-api-access-token.md](./test/test-user-api-access-token.md) | `apiAccessToken.generate` 的入参校验、幂等覆盖、失败语义对齐、明文不回显 | `src/server/features/api-access-token/**`、`src/server/lib/trpc/routers/api-access-token.ts` |
| [test-bearer-request-authentication.md](./test/test-bearer-request-authentication.md) | tRPC `createContext` 中的 Bearer 解析、与 Session 的优先级、不延长会话、不可用于生成接口 | `src/app/api/trpc/[trpc]/route.ts`、`src/server/features/api-access-token/infrastructure/**` |

## 验收 Checklist

- [ ] `test-user-api-access-token.md` 中全部条目有对应自动化或可重复手工步骤验证。
- [ ] `test-bearer-request-authentication.md` 中全部条目有对应验证。
- [ ] 全量测试通过 + TypeScript 类型检查无错误（见 `4-task.md` 收尾项）。
