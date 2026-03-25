import { describe, it, expect, vi } from "vitest";
import {
  executeLoginUserUseCase,
  type LoginUserCommand,
  type LoginUserUseCaseDeps,
} from "../login-user-use-case";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { User } from "@/server/features/person/domain/entities/user";

/**
 * 构造 LoginUserUseCase 的 mock 依赖。
 * 默认所有方法为空 mock，可通过 overrides 覆盖特定行为。
 */
function createMockDeps(
  overrides?: Partial<LoginUserUseCaseDeps>,
): LoginUserUseCaseDeps {
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
    ...overrides,
  };
}

/** 构造一个用于测试的假用户实体 */
function createFakeUser() {
  return User.register({
    id: "user-1",
    username: "testuser",
    passwordHash: "hashed-password",
    initialMoney: 10000,
  });
}
describe("executeLoginUserUseCase", () => {
  const validCommand: LoginUserCommand = {
    username: "testuser",
    password: "password123",
  };

  // -------- Happy Path --------

  it("用户名密码正确时，返回登录成功", async () => {
    // Arrange: 用户存在，且密码验证通过
    const fakeUser = createFakeUser();
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
    });

    // Act
    const result = await executeLoginUserUseCase(validCommand, deps);

    // Assert: 返回成功结果，包含用户 id 和 username
    expect(result).toEqual({
      ok: true,
      user: { id: "user-1", username: "testuser" },
    });
  });

  // -------- 认证失败场景 --------

  it("用户不存在时，返回失败", async () => {
    // Arrange: findByUsername 返回 null，模拟用户不存在
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      },
    });

    // Act
    const result = await executeLoginUserUseCase(validCommand, deps);

    // Assert: 返回通用错误信息，且不应调用密码验证（短路逻辑）
    expect(result).toEqual({ ok: false, error: "用户名或密码错误" });
    expect(deps.passwordHasher.verify).not.toHaveBeenCalled();
  });

  it("密码错误时，返回失败", async () => {
    // Arrange: 用户存在，但密码验证不通过
    const fakeUser = createFakeUser();
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
    });

    // Act
    const result = await executeLoginUserUseCase(validCommand, deps);

    // Assert
    expect(result).toEqual({ ok: false, error: "用户名或密码错误" });
  });

  // -------- 安全性 --------

  it("用户不存在和密码错误返回相同的错误信息（防枚举）", async () => {
    // 安全要求：攻击者不应通过错误信息区分「用户名不存在」和「密码错误」
    const fakeUser = createFakeUser();
    const depsNoUser = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      },
    });

    const depsWrongPassword = createMockDeps({
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

    const resultNoUser = await executeLoginUserUseCase(validCommand, depsNoUser);
    const resultWrongPwd = await executeLoginUserUseCase(validCommand, depsWrongPassword);

    // Assert: 两种失败场景返回完全相同的错误结构
    expect(resultNoUser).toEqual(resultWrongPwd);
  });

  // -------- 输入校验 --------

  it("用户名格式非法时，抛出 DomainError", async () => {
    // Arrange: 用户名 "ab" 长度为 2，不满足 Username 值对象的 [3, 32] 约束
    const deps = createMockDeps();
    const badCommand: LoginUserCommand = { username: "ab", password: "password123" };

    // Assert: Username.create() 在 use case 内部抛出 DomainError
    await expect(executeLoginUserUseCase(badCommand, deps)).rejects.toThrow(
      "用户名长度必须在 3 到 32 之间",
    );
    // 不应触达数据库查询
    expect(deps.userRepository.findByUsername).not.toHaveBeenCalled();
  });

  // -------- 交互验证 --------

  it("验证密码时传入了正确的参数", async () => {
    // 确保 use case 将明文密码和数据库中的 hash 正确传递给 passwordHasher.verify
    const fakeUser = createFakeUser();
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
    });

    await executeLoginUserUseCase(validCommand, deps);

    // Assert: verify(明文密码, 数据库存储的哈希)
    expect(deps.passwordHasher.verify).toHaveBeenCalledWith(
      "password123",
      "hashed-password",
    );
  });
});
