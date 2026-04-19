import { describe, it, expect, vi, beforeEach } from "vitest";
import { createResolveUserIdFromBearer } from "../resolve-user-id-from-bearer";
import type { ApiAccessTokenRepository } from "@/server/features/api-access-token/domain/repositories/api-access-token-repository";
import type { TokenHasher } from "@/server/features/api-access-token/domain/services/token-hasher";

function createDeps(overrides?: {
  findUserIdByHash?: (hash: string) => Promise<string | null>;
  hash?: (plain: string) => string;
}) {
  const apiAccessTokenRepository: ApiAccessTokenRepository = {
    upsertForUser: vi.fn(),
    findUserIdByHash: vi.fn(overrides?.findUserIdByHash ?? (async () => null)),
  };
  const tokenHasher: TokenHasher = {
    hash: vi.fn(overrides?.hash ?? ((plain: string) => `hash(${plain})`)),
  };
  return { apiAccessTokenRepository, tokenHasher };
}

describe("createResolveUserIdFromBearer", () => {
  describe("Authorization 头格式判定", () => {
    it("authHeader 为 null 时返回 null，且不调用 hasher / repository", async () => {
      const deps = createDeps();
      const resolve = createResolveUserIdFromBearer(deps);

      const result = await resolve(null);

      expect(result).toBeNull();
      expect(deps.tokenHasher.hash).not.toHaveBeenCalled();
      expect(deps.apiAccessTokenRepository.findUserIdByHash).not.toHaveBeenCalled();
    });

    it("authHeader 为空字符串 / 仅空白时返回 null", async () => {
      const deps = createDeps();
      const resolve = createResolveUserIdFromBearer(deps);

      expect(await resolve("")).toBeNull();
      expect(await resolve("   ")).toBeNull();
      expect(deps.tokenHasher.hash).not.toHaveBeenCalled();
      expect(deps.apiAccessTokenRepository.findUserIdByHash).not.toHaveBeenCalled();
    });

    it("非 Bearer scheme（如 Basic / token）一律返回 null，不触发 hash 与查询", async () => {
      const deps = createDeps();
      const resolve = createResolveUserIdFromBearer(deps);

      expect(await resolve("Basic dXNlcjpwYXNz")).toBeNull();
      expect(await resolve("token awt_abc")).toBeNull();
      expect(await resolve("awt_abc")).toBeNull();
      expect(deps.tokenHasher.hash).not.toHaveBeenCalled();
    });

    it("Bearer scheme 大小写不敏感", async () => {
      const findUserIdByHash = vi.fn(async () => "user-1");
      const deps = createDeps({ findUserIdByHash });
      const resolve = createResolveUserIdFromBearer(deps);

      expect(await resolve("bearer awt_token")).toBe("user-1");
      expect(await resolve("BEARER awt_token")).toBe("user-1");
      expect(await resolve("BeArEr awt_token")).toBe("user-1");
    });

    it("Bearer 与 token 之间允许多个空白；token 两侧空白会被去除", async () => {
      const findUserIdByHash = vi.fn(async () => "user-1");
      const hashMock = vi.fn((plain: string) => `H(${plain})`);
      const deps = createDeps({ findUserIdByHash, hash: hashMock });
      const resolve = createResolveUserIdFromBearer(deps);

      await resolve("Bearer    awt_token   ");

      expect(hashMock).toHaveBeenCalledWith("awt_token");
    });

    it("Bearer 之后 token 为空时返回 null", async () => {
      const deps = createDeps();
      const resolve = createResolveUserIdFromBearer(deps);

      expect(await resolve("Bearer ")).toBeNull();
      expect(await resolve("Bearer    ")).toBeNull();
      expect(deps.tokenHasher.hash).not.toHaveBeenCalled();
    });
  });

  describe("长度守卫", () => {
    it("超过 256 字符的 token 一律返回 null，不进入 hash", async () => {
      const deps = createDeps();
      const resolve = createResolveUserIdFromBearer(deps);

      const longToken = "awt_" + "x".repeat(300);
      const result = await resolve(`Bearer ${longToken}`);

      expect(result).toBeNull();
      expect(deps.tokenHasher.hash).not.toHaveBeenCalled();
      expect(deps.apiAccessTokenRepository.findUserIdByHash).not.toHaveBeenCalled();
    });
  });

  describe("命中 / 不命中", () => {
    it("命中时返回 userId，调用链：hasher.hash → repo.findUserIdByHash", async () => {
      const findUserIdByHash = vi.fn(async (hash: string) => {
        return hash === "H(awt_known)" ? "user-42" : null;
      });
      const hashMock = vi.fn((plain: string) => `H(${plain})`);
      const deps = createDeps({ findUserIdByHash, hash: hashMock });
      const resolve = createResolveUserIdFromBearer(deps);

      const result = await resolve("Bearer awt_known");

      expect(result).toBe("user-42");
      expect(hashMock).toHaveBeenCalledWith("awt_known");
      expect(findUserIdByHash).toHaveBeenCalledWith("H(awt_known)");
    });

    it("未命中（repo 返回 null）时返回 null", async () => {
      const deps = createDeps({ findUserIdByHash: async () => null });
      const resolve = createResolveUserIdFromBearer(deps);

      const result = await resolve("Bearer awt_unknown");

      expect(result).toBeNull();
    });
  });

  describe("健壮性：异常输入不应抛", () => {
    it("乱码 / 控制字符 / 非常规字符也不抛异常，返回 null 或正常查不到", async () => {
      const deps = createDeps({ findUserIdByHash: async () => null });
      const resolve = createResolveUserIdFromBearer(deps);

      await expect(resolve("Bearer \u0000\u0001gibberish")).resolves.toBeNull();
      await expect(resolve("Bearer 中文😀token")).resolves.toBeNull();
    });
  });

  // Step 2 of beforeEach pattern not strictly needed since each test makes its own deps
  beforeEach(() => {
    vi.clearAllMocks();
  });
});
