import { describe, it, expect, vi } from "vitest";
import {
  executeRegisterUserUseCase,
  type RegisterUserCommand,
  type RegisterUserUseCaseDeps,
} from "../register-user-use-case";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { User } from "@/server/features/person/domain/entities/user";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { ADAM_USER_ID } from "@/server/features/shared-kernel/domain/adam";

/**
 * 构造 RegisterUserUseCase 的 mock 依赖。
 * 默认行为：findByUsername 返回 null（用户不存在）、hash 返回固定值。
 * 可通过 overrides 覆盖特定依赖的行为。
 */
function createMockDeps(
  overrides?: Partial<RegisterUserUseCaseDeps>,
): RegisterUserUseCaseDeps {
  return {
    userRepository: {
      findById: vi.fn(),
      findByUsername: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    } satisfies UserRepository,
    transactionLedgerRepository: {
      record: vi.fn(),
    } satisfies TransactionLedgerRepository,
    systemAccountService: {
      getSystemAccount: vi.fn().mockResolvedValue(createAdamUser()),
    },
    passwordHasher: {
      hash: vi.fn().mockResolvedValue("hashed-new-password"),
      verify: vi.fn(),
    } satisfies PasswordHasher,
    transact: (async <T>(fn: () => Promise<T>) => fn()) as RegisterUserUseCaseDeps["transact"],
    ...overrides,
  };
}

/**
 * 构造系统初始用户 Adam 的实体。
 * Adam 是所有新用户注册赠金的资金来源，余额设为 10 亿。
 */
function createAdamUser() {
  return User.rehydrate({
    id: ADAM_USER_ID,
    username: { getValue: () => "adam" } as any,
    passwordHash: "adam-hash",
    money: 1_000_000_000,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });
}

describe("executeRegisterUserUseCase", () => {
  const validCommand: RegisterUserCommand = {
    username: "newuser",
    password: "password123",
  };

  // -------- Happy Path --------

  it("正常注册成功，返回用户信息", async () => {
    // Arrange: 用户名不存在 + Adam 已初始化
    const adam = createAdamUser();
    const deps = createMockDeps({
      systemAccountService: {
        getSystemAccount: vi.fn().mockResolvedValue(adam),
      },
    });

    // Act
    const result = await executeRegisterUserUseCase(validCommand, deps);

    // Assert: 注册成功，返回新用户的 id 和 username
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.username).toBe("newuser");
      expect(result.user.id).toBeDefined();
    }
  });

  // -------- 用户名冲突场景 --------

  it("用户名为 adam（系统保留）时，返回 409", async () => {
    // "adam" 是系统初始用户，不允许注册
    const deps = createMockDeps();

    const result = await executeRegisterUserUseCase(
      { username: "Adam", password: "password123" },
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "该用户名为系统保留名称",
      code: "CONFLICT",
    });
    // 保留名检查在查库之前，不应触达数据库
    expect(deps.userRepository.findByUsername).not.toHaveBeenCalled();
  });

  it("用户名为 ADAM（大小写不敏感）时，同样返回 409", async () => {
    // 验证 trim + toLowerCase 的规范化逻辑
    const deps = createMockDeps();

    const result = await executeRegisterUserUseCase(
      { username: "  ADAM  ", password: "password123" },
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "该用户名为系统保留名称",
      code: "CONFLICT",
    });
  });

  it("用户名已存在时，返回 409", async () => {
    // Arrange: findByUsername 返回已存在的用户
    const existingUser = User.register({
      id: "existing-id",
      username: "newuser",
      passwordHash: "some-hash",
    });
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(existingUser),
        save: vi.fn(),
      },
    });


    // Act
    const result = await executeRegisterUserUseCase(validCommand, deps);

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "用户名已存在",
      code: "CONFLICT",
    });
  });

  // -------- 系统状态校验 --------

  it("Adam 用户不存在（系统未初始化）时，抛出 DomainError", async () => {
    // 注册流程依赖 Adam 作为资金来源，Adam 不存在说明系统未初始化
    const deps = createMockDeps({
      systemAccountService: {
        getSystemAccount: vi.fn().mockRejectedValue(
          new DomainError("系统尚未初始化，请先运行 init:system"),
        ),
      },
    });

    await expect(
      executeRegisterUserUseCase(validCommand, deps),
    ).rejects.toThrow("系统尚未初始化，请先运行 init:system");
  });

  // -------- 副作用验证：资金转移 --------

  it("注册成功后，Adam 被扣除 10000 赠金", async () => {
    // 新用户注册时，系统从 Adam 账户转出 10000 作为初始资金
    const adam = createAdamUser();
    const originalMoney = adam.money;
    const deps = createMockDeps({
      systemAccountService: {
        getSystemAccount: vi.fn().mockResolvedValue(adam),
      },
    });

    await executeRegisterUserUseCase(validCommand, deps);

    // Assert: Adam 的余额减少了 10000
    expect(adam.money).toBe(originalMoney - 10000);
  });

  // -------- 副作用验证：持久化 --------

  it("注册成功后，save 被调用两次（Adam + 新用户）", async () => {
    // 需要持久化两个实体：扣款后的 Adam 和新创建的用户
    const adam = createAdamUser();
    const deps = createMockDeps({
      systemAccountService: {
        getSystemAccount: vi.fn().mockResolvedValue(adam),
      },
    });

    await executeRegisterUserUseCase(validCommand, deps);

    expect(deps.userRepository.save).toHaveBeenCalledTimes(2);
    // 第一次 save 的是 Adam（扣款后）
    expect(deps.userRepository.save).toHaveBeenCalledWith(adam);
  });

  // -------- 副作用验证：交易流水 --------

  it("注册成功后，记录了正确的交易流水", async () => {
    const adam = createAdamUser();
    const deps = createMockDeps({
      systemAccountService: {
        getSystemAccount: vi.fn().mockResolvedValue(adam),
      },
    });

    const result = await executeRegisterUserUseCase(validCommand, deps);

    // Assert: 交易记录包含正确的转账方、金额和类型
    expect(deps.transactionLedgerRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        fromUserId: ADAM_USER_ID,
        amount: 10000,
        type: "registration_grant",
      }),
    );

    // Assert: 交易记录的收款方是新注册的用户
    if (result.ok) {
      expect(deps.transactionLedgerRepository.record).toHaveBeenCalledWith(
        expect.objectContaining({ toUserId: result.user.id }),
      );
    }
  });

  // -------- 交互验证：密码处理 --------

  it("密码经过 hash 处理后再存储", async () => {
    // 确保明文密码不会被直接存储，而是经过 passwordHasher.hash 处理
    const adam = createAdamUser();
    const deps = createMockDeps({
      systemAccountService: {
        getSystemAccount: vi.fn().mockResolvedValue(adam),
      },
    });

    await executeRegisterUserUseCase(validCommand, deps);

    // Assert: hash 被调用时传入的是用户提交的明文密码
    expect(deps.passwordHasher.hash).toHaveBeenCalledWith("password123");
  });

  // -------- 输入校验 --------

  it("用户名格式非法时，抛出 DomainError", async () => {
    // 用户名 "ab" 长度为 2，不满足 Username 值对象的 [3, 32] 约束
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn(),
        findByUsername: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      },
    });

    await expect(
      executeRegisterUserUseCase(
        { username: "ab", password: "password123" },
        deps,
      ),
    ).rejects.toThrow("用户名长度必须在 3 到 32 之间");
  });
});
