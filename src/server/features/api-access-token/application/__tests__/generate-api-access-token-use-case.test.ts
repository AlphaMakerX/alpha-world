import { describe, it, expect, vi } from "vitest";
import {
  executeGenerateApiAccessTokenUseCase,
  type GenerateApiAccessTokenCommand,
  type GenerateApiAccessTokenUseCaseDeps,
} from "../generate-api-access-token-use-case";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import type { TokenGenerator } from "@/server/features/api-access-token/domain/services/token-generator";
import type { TokenHasher } from "@/server/features/api-access-token/domain/services/token-hasher";
import type { ApiAccessTokenRepository } from "@/server/features/api-access-token/domain/repositories/api-access-token-repository";
import { User } from "@/server/features/person/domain/entities/user";

function createMockDeps(
  overrides?: Partial<GenerateApiAccessTokenUseCaseDeps>,
): GenerateApiAccessTokenUseCaseDeps {
  return {
    userRepository: {
      findById: vi.fn(),
      findByUsername: vi.fn(),
      save: vi.fn(),
    } satisfies UserRepository,
    passwordHasher: {
      hash: vi.fn(),
      verify: vi.fn(),
    } satisfies PasswordHasher,
    tokenGenerator: {
      generate: vi.fn(),
    } satisfies TokenGenerator,
    tokenHasher: {
      hash: vi.fn(),
    } satisfies TokenHasher,
    apiAccessTokenRepository: {
      upsertForUser: vi.fn(),
      findUserIdByHash: vi.fn(),
    } satisfies ApiAccessTokenRepository,
    ...overrides,
  };
}

function createFakeUser() {
  return User.register({
    id: "user-1",
    username: "testuser",
    passwordHash: "hashed-password",
    initialMoney: 10000,
  });
}

describe("executeGenerateApiAccessTokenUseCase", () => {
  const validCommand: GenerateApiAccessTokenCommand = {
    username: "testuser",
    password: "password123",
  };

  // -------- Happy Path --------

  it("用户名密码正确时，签发新令牌并返回明文", async () => {
    const fakeUser = createFakeUser();
    const upsertForUser = vi.fn().mockResolvedValue(undefined);
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(fakeUser),
        save: vi.fn(),
      },
      passwordHasher: {
        hash: vi.fn(),
        verify: vi.fn().mockResolvedValue(true),
      },
      tokenGenerator: {
        generate: vi.fn().mockReturnValue("awt_plain-token-xyz"),
      },
      tokenHasher: {
        hash: vi.fn().mockReturnValue("hashed-token-abc"),
      },
      apiAccessTokenRepository: {
        upsertForUser,
        findUserIdByHash: vi.fn(),
      },
    });

    const result = await executeGenerateApiAccessTokenUseCase(validCommand, deps);

    expect(result).toEqual({ ok: true, token: "awt_plain-token-xyz" });
    expect(deps.tokenHasher.hash).toHaveBeenCalledWith("awt_plain-token-xyz");
    expect(upsertForUser).toHaveBeenCalledWith({
      userId: "user-1",
      tokenHash: "hashed-token-abc",
    });
  });

  it("成功路径：明文不会传给 repository（只保存摘要）", async () => {
    const fakeUser = createFakeUser();
    const upsertForUser = vi.fn().mockResolvedValue(undefined);
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(fakeUser),
        save: vi.fn(),
      },
      passwordHasher: {
        hash: vi.fn(),
        verify: vi.fn().mockResolvedValue(true),
      },
      tokenGenerator: {
        generate: vi.fn().mockReturnValue("awt_super-secret-plain"),
      },
      tokenHasher: {
        hash: vi.fn().mockReturnValue("digest-only"),
      },
      apiAccessTokenRepository: {
        upsertForUser,
        findUserIdByHash: vi.fn(),
      },
    });

    await executeGenerateApiAccessTokenUseCase(validCommand, deps);

    const upsertArg = upsertForUser.mock.calls[0]?.[0];
    expect(upsertArg).toBeDefined();
    expect(upsertArg.tokenHash).toBe("digest-only");
    expect(upsertArg.tokenHash).not.toContain("awt_super-secret-plain");
    expect(JSON.stringify(upsertArg)).not.toContain("awt_super-secret-plain");
  });

  // -------- 认证失败场景 --------

  it("用户不存在时，返回与登录同形的失败，不签发令牌", async () => {
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      },
    });

    const result = await executeGenerateApiAccessTokenUseCase(validCommand, deps);

    expect(result).toEqual({ ok: false, error: "用户名或密码错误" });
    expect(deps.passwordHasher.verify).not.toHaveBeenCalled();
    expect(deps.tokenGenerator.generate).not.toHaveBeenCalled();
    expect(deps.tokenHasher.hash).not.toHaveBeenCalled();
    expect(deps.apiAccessTokenRepository.upsertForUser).not.toHaveBeenCalled();
  });

  it("密码错误时，返回失败且不写入 user_api_tokens", async () => {
    const fakeUser = createFakeUser();
    const upsertForUser = vi.fn();
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(fakeUser),
        save: vi.fn(),
      },
      passwordHasher: {
        hash: vi.fn(),
        verify: vi.fn().mockResolvedValue(false),
      },
      apiAccessTokenRepository: {
        upsertForUser,
        findUserIdByHash: vi.fn(),
      },
    });

    const result = await executeGenerateApiAccessTokenUseCase(validCommand, deps);

    expect(result).toEqual({ ok: false, error: "用户名或密码错误" });
    expect(deps.tokenGenerator.generate).not.toHaveBeenCalled();
    expect(deps.tokenHasher.hash).not.toHaveBeenCalled();
    expect(upsertForUser).not.toHaveBeenCalled();
  });

  // -------- 安全性：防账户枚举 --------

  it("用户不存在与密码错误返回完全相同的失败响应", async () => {
    const fakeUser = createFakeUser();

    const depsNoUser = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      },
    });

    const depsWrongPwd = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(fakeUser),
        save: vi.fn(),
      },
      passwordHasher: {
        hash: vi.fn(),
        verify: vi.fn().mockResolvedValue(false),
      },
    });

    const r1 = await executeGenerateApiAccessTokenUseCase(validCommand, depsNoUser);
    const r2 = await executeGenerateApiAccessTokenUseCase(validCommand, depsWrongPwd);

    expect(r1).toEqual(r2);
  });

  // -------- 幂等覆盖 --------

  it("重复成功调用：每次都签发新明文，且每次都调用 upsert 覆盖摘要", async () => {
    const fakeUser = createFakeUser();
    const upsertForUser = vi.fn().mockResolvedValue(undefined);
    const generate = vi
      .fn()
      .mockReturnValueOnce("awt_first")
      .mockReturnValueOnce("awt_second");
    const hash = vi
      .fn()
      .mockReturnValueOnce("hash-first")
      .mockReturnValueOnce("hash-second");

    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(fakeUser),
        save: vi.fn(),
      },
      passwordHasher: {
        hash: vi.fn(),
        verify: vi.fn().mockResolvedValue(true),
      },
      tokenGenerator: { generate },
      tokenHasher: { hash },
      apiAccessTokenRepository: {
        upsertForUser,
        findUserIdByHash: vi.fn(),
      },
    });

    const r1 = await executeGenerateApiAccessTokenUseCase(validCommand, deps);
    const r2 = await executeGenerateApiAccessTokenUseCase(validCommand, deps);

    expect(r1).toEqual({ ok: true, token: "awt_first" });
    expect(r2).toEqual({ ok: true, token: "awt_second" });
    expect(upsertForUser).toHaveBeenNthCalledWith(1, {
      userId: "user-1",
      tokenHash: "hash-first",
    });
    expect(upsertForUser).toHaveBeenNthCalledWith(2, {
      userId: "user-1",
      tokenHash: "hash-second",
    });
  });

  // -------- 输入校验 --------

  it("用户名格式非法时抛出 DomainError，不触达任何 IO", async () => {
    const deps = createMockDeps();
    const badCommand: GenerateApiAccessTokenCommand = {
      username: "ab",
      password: "password123",
    };

    await expect(
      executeGenerateApiAccessTokenUseCase(badCommand, deps),
    ).rejects.toThrow("用户名长度必须在 3 到 32 之间");

    expect(deps.userRepository.findByUsername).not.toHaveBeenCalled();
    expect(deps.tokenGenerator.generate).not.toHaveBeenCalled();
    expect(deps.apiAccessTokenRepository.upsertForUser).not.toHaveBeenCalled();
  });
});
