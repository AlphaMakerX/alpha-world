import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

// 隔离测试：替换整条 composition 模块，避免触达 DB / NextAuth。
// 仅暴露 procedure 直接依赖的两个导出：use case 函数 + zod schema。
vi.mock("@/server/features/api-access-token/composition", async () => {
  const { z } = await import("zod");
  return {
    executeGenerateApiAccessTokenUseCase: vi.fn(),
    generateApiAccessTokenSchema: z.object({
      username: z.string().trim().min(3).max(32),
      password: z.string().min(6).max(128),
    }),
  };
});

import { createTRPCRouter } from "@/server/lib/trpc/core";
import { apiAccessTokenRouter } from "@/server/lib/trpc/routers/api-access-token";
import { executeGenerateApiAccessTokenUseCase } from "@/server/features/api-access-token/composition";

const mockedExecute = vi.mocked(executeGenerateApiAccessTokenUseCase);

const standaloneRouter = createTRPCRouter({
  apiAccessToken: apiAccessTokenRouter,
});

type CallerCtx = {
  userId: string | null;
  session: Session | null;
  userRole: "admin" | "user" | null;
  tokenPresentButInvalid: boolean;
};

function makeCaller(overrides?: Partial<CallerCtx>) {
  return standaloneRouter.createCaller({
    userId: overrides?.userId ?? null,
    session: overrides?.session ?? null,
    userRole: overrides?.userRole ?? null,
    tokenPresentButInvalid: overrides?.tokenPresentButInvalid ?? false,
  });
}

describe("trpc apiAccessToken.generate procedure", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
  });

  // -------- Happy Path --------

  it("合法入参 → 返回 { token: 'awt_...' }，并把入参原样传给 use case", async () => {
    mockedExecute.mockResolvedValue({ ok: true, token: "awt_test-plain" });

    const caller = makeCaller();
    const result = await caller.apiAccessToken.generate({
      username: "alice",
      password: "secret123",
    });

    expect(result).toEqual({ token: "awt_test-plain" });
    expect(mockedExecute).toHaveBeenCalledWith({
      username: "alice",
      password: "secret123",
    });
  });

  // -------- 用例失败语义透传 --------

  it("用例返回失败 → 抛 TRPCError，message 与 error 一致", async () => {
    mockedExecute.mockResolvedValue({
      ok: false,
      error: "用户名或密码错误",
    });

    const caller = makeCaller();
    await expect(
      caller.apiAccessToken.generate({
        username: "alice",
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      name: "TRPCError",
      message: "用户名或密码错误",
      code: "BAD_REQUEST",
    });
  });

  // -------- 入参校验 --------

  it("非法入参（username 太短）→ zod 校验失败，且 use case 未被调用", async () => {
    const caller = makeCaller();
    await expect(
      caller.apiAccessToken.generate({
        username: "ab",
        password: "secret123",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(mockedExecute).not.toHaveBeenCalled();
  });

  it("非法入参（password 太短）→ zod 校验失败，且 use case 未被调用", async () => {
    const caller = makeCaller();
    await expect(
      caller.apiAccessToken.generate({
        username: "alice",
        password: "1",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(mockedExecute).not.toHaveBeenCalled();
  });

  // -------- procedure 不读 ctx --------

  it("ctx 携带任意 Session/Bearer 但 password 错误 → 仍按用例失败语义返回，不得因 ctx 而成功", async () => {
    mockedExecute.mockResolvedValue({
      ok: false,
      error: "用户名或密码错误",
    });

    const caller = makeCaller({
      userId: "bearer-user-id",
      session: {
        user: { id: "session-user-id", name: "session-user" },
        expires: "2099-01-01T00:00:00.000Z",
      } as unknown as Session,
    });

    await expect(
      caller.apiAccessToken.generate({
        username: "alice",
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({ message: "用户名或密码错误" });
  });

  it("ctx 携带 Session/Bearer 时入参正确 → use case 收到 input.username（非 ctx 用户）", async () => {
    mockedExecute.mockResolvedValue({ ok: true, token: "awt_for-alice" });

    const caller = makeCaller({
      userId: "bearer-user-id",
      session: {
        user: { id: "session-user-id" },
        expires: "2099-01-01T00:00:00.000Z",
      } as unknown as Session,
    });

    const result = await caller.apiAccessToken.generate({
      username: "alice",
      password: "secret123",
    });

    expect(result).toEqual({ token: "awt_for-alice" });
    expect(mockedExecute).toHaveBeenCalledWith({
      username: "alice",
      password: "secret123",
    });
    // 既未泄漏 ctx 中的用户身份，也未把 ctx 字段塞进 input
    const callArg = mockedExecute.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArg).not.toHaveProperty("userId");
    expect(callArg).not.toHaveProperty("session");
  });
});
