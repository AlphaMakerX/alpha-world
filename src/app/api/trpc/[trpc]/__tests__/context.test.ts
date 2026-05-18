import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Session } from "next-auth";
import { TRPCError } from "@trpc/server";

// next-auth 的 getServerSession 必须 mock：避免真实读 cookie / 触达 NextAuth 内部
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// auth-options 间接 import 了 auth/composition → person/infrastructure → db，
// 在测试环境会触发 "DATABASE_URL is not set"。这里替换为最小 stub。
vi.mock("@/server/lib/auth/auth-options", () => ({
  authOptions: {},
}));

// 隔离 composition 模块，避免触达 DB 与真实 repository
vi.mock("@/server/features/api-access-token/composition", () => ({
  resolveUserIdFromBearer: vi.fn(),
}));

vi.mock("@/server/features/person/composition", () => ({
  resolveUserRole: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { resolveUserIdFromBearer } from "@/server/features/api-access-token/composition";
import { resolveUserRole } from "@/server/features/person/composition";
import { createTrpcContext } from "../context";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/lib/trpc/core";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedResolveBearer = vi.mocked(resolveUserIdFromBearer);
const mockedResolveUserRole = vi.mocked(resolveUserRole);

function makeReq(authHeader?: string | null): Request {
  const headers = new Headers();
  if (authHeader !== undefined && authHeader !== null) {
    headers.set("authorization", authHeader);
  }
  return new Request("http://localhost/api/trpc/x", { headers });
}

function makeSession(userId: string): Session {
  return {
    user: { id: userId, name: userId },
    expires: "2099-01-01T00:00:00.000Z",
  } as unknown as Session;
}

describe("createTrpcContext", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedResolveBearer.mockReset();
    mockedResolveUserRole.mockReset();
    mockedResolveUserRole.mockResolvedValue("user");
  });

  it("无 Session、无 Authorization → userId/session 均为 null，tokenPresentButInvalid 为 false", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    mockedResolveBearer.mockResolvedValue(null);

    const ctx = await createTrpcContext({ req: makeReq() });

    expect(ctx).toEqual({
      session: null,
      userId: null,
      userRole: null,
      tokenPresentButInvalid: false,
    });
    expect(mockedResolveBearer).toHaveBeenCalledWith(null);
  });

  it("仅有 Session（无 Bearer）→ userId 取 Session 用户，session 非空", async () => {
    mockedGetServerSession.mockResolvedValue(makeSession("session-user"));
    mockedResolveBearer.mockResolvedValue(null);

    const ctx = await createTrpcContext({ req: makeReq() });

    expect(ctx.userId).toBe("session-user");
    expect(ctx.session).not.toBeNull();
    expect(ctx.tokenPresentButInvalid).toBe(false);
  });

  it("仅有有效 Bearer（无 Session）→ userId 取 Bearer，session 保持 null", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    mockedResolveBearer.mockResolvedValue("bearer-user");

    const ctx = await createTrpcContext({ req: makeReq("Bearer awt_valid") });

    expect(ctx.userId).toBe("bearer-user");
    expect(ctx.session).toBeNull();
    expect(ctx.tokenPresentButInvalid).toBe(false);
    expect(mockedResolveBearer).toHaveBeenCalledWith("Bearer awt_valid");
  });

  it("Bearer 与 Session 解析出不同用户 → Bearer 优先", async () => {
    mockedGetServerSession.mockResolvedValue(makeSession("session-user"));
    mockedResolveBearer.mockResolvedValue("bearer-user");

    const ctx = await createTrpcContext({ req: makeReq("Bearer awt_valid") });

    expect(ctx.userId).toBe("bearer-user");
    // session 仍是 NextAuth 原值（不被 Bearer 覆盖）
    expect((ctx.session?.user as { id?: string } | undefined)?.id).toBe("session-user");
  });

  it("Authorization 头存在但 Bearer 解析失败、且无 Session → userId=null, tokenPresentButInvalid=true", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    mockedResolveBearer.mockResolvedValue(null);

    const ctx = await createTrpcContext({
      req: makeReq("Bearer awt_garbage"),
    });

    expect(ctx.userId).toBeNull();
    expect(ctx.session).toBeNull();
    expect(ctx.tokenPresentButInvalid).toBe(true);
  });

  it("Authorization 头存在但解析失败、有有效 Session → userId 回退到 Session", async () => {
    mockedGetServerSession.mockResolvedValue(makeSession("session-user"));
    mockedResolveBearer.mockResolvedValue(null);

    const ctx = await createTrpcContext({
      req: makeReq("Bearer awt_garbage"),
    });

    expect(ctx.userId).toBe("session-user");
    // Bearer 头存在但无效；中间件可据此提示"令牌无效"
    expect(ctx.tokenPresentButInvalid).toBe(true);
  });

  it("仅有 Bearer 请求时，getServerSession 仍被调用（read-only），不会写 Set-Cookie", async () => {
    // 注：Set-Cookie 是 NextAuth 自身行为；getServerSession 为只读，不会触发会话刷新。
    // 此处通过断言我们没有引入任何会话写路径来兜底（只调用 getServerSession 一次）。
    mockedGetServerSession.mockResolvedValue(null);
    mockedResolveBearer.mockResolvedValue("bearer-user");

    await createTrpcContext({ req: makeReq("Bearer awt_valid") });

    expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
  });

  it("authorization 头键名大小写不敏感（HTTP 规范）", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    mockedResolveBearer.mockResolvedValue("bearer-user");

    const headers = new Headers();
    headers.set("Authorization", "Bearer awt_valid");
    const req = new Request("http://localhost/api/trpc/x", { headers });

    const ctx = await createTrpcContext({ req });

    expect(ctx.userId).toBe("bearer-user");
    expect(mockedResolveBearer).toHaveBeenCalledWith("Bearer awt_valid");
  });
});

describe("protectedProcedure 中间件：错误文案区分", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedResolveBearer.mockReset();
  });

  const router = createTRPCRouter({
    ping: protectedProcedure.query(({ ctx }) => ({ userId: ctx.userId })),
  });

  it("未登录（无 Bearer 头）→ message 为 '请先登录'", async () => {
    const caller = router.createCaller({
      session: null,
      userId: null,
      userRole: null,
      tokenPresentButInvalid: false,
    });

    await expect(caller.ping()).rejects.toMatchObject({
      name: "TRPCError",
      code: "UNAUTHORIZED",
      message: "请先登录",
    });
  });

  it("Bearer 头存在但无效（且无 Session）→ message 为 'API 令牌无效或已失效'", async () => {
    const caller = router.createCaller({
      session: null,
      userId: null,
      userRole: null,
      tokenPresentButInvalid: true,
    });

    await expect(caller.ping()).rejects.toMatchObject({
      name: "TRPCError",
      code: "UNAUTHORIZED",
      message: "API 令牌无效或已失效",
    });
  });

  it("身份解析成功（来自 Session 或 Bearer）→ 中间件放行，不论 tokenPresentButInvalid 取何值", async () => {
    const caller1 = router.createCaller({
      session: null,
      userId: "user-1",
      userRole: "user",
      tokenPresentButInvalid: false,
    });
    await expect(caller1.ping()).resolves.toEqual({ userId: "user-1" });

    // 边界：Bearer 头存在但无效，但 Session 兜住了 userId — 不应再以"令牌无效"误报
    const caller2 = router.createCaller({
      session: null,
      userId: "user-1",
      userRole: "user",
      tokenPresentButInvalid: true,
    });
    await expect(caller2.ping()).resolves.toEqual({ userId: "user-1" });
  });

  it("无 userId 时不应抛 TRPCError 之外的异常", async () => {
    const caller = router.createCaller({
      session: null,
      userId: null,
      userRole: null,
      tokenPresentButInvalid: false,
    });
    const err = await caller.ping().catch((e) => e);
    expect(err).toBeInstanceOf(TRPCError);
  });
});
