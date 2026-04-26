import { describe, it, expect, vi } from "vitest";
import {
  executeRegisterUserUseCase,
  type RegisterUserCommand,
  type RegisterUserUseCaseDeps,
} from "../register-user-use-case";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { FinanceService } from "@/server/features/finance/domain/finance-service";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { User } from "@/server/features/person/domain/entities/user";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";

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
    financeService: {
      transfer: vi.fn(),
      freeze: vi.fn(),
      refund: vi.fn(),
      release: vi.fn(),
    } satisfies FinanceService,
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
    id: ADAM_PERSONA_CONFIG.userId,
    username: { getValue: () => "adam" } as any,
    passwordHash: "adam-hash",
    money: 1_000_000_000,
    positionX: 140,
    positionY: 600,
    staminaCurrent: 100,
    staminaMax: 100,
    staminaUpdatedAt: new Date("2025-01-01"),
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

  it("注册成功后，financeService.transfer 被调用转账 10000 赠金", async () => {
    // 新用户注册时，系统从 Adam 账户转出 10000 作为初始资金
    const adam = createAdamUser();
    const deps = createMockDeps({
      systemAccountService: {
        getSystemAccount: vi.fn().mockResolvedValue(adam),
      },
    });

    await executeRegisterUserUseCase(validCommand, deps);

    // Assert: financeService.transfer 被调用，金额为 10000
    expect(deps.financeService.transfer).toHaveBeenCalledWith(
      expect.objectContaining({
        payer: adam,
        amount: 10000,
        type: "registration_grant",
      }),
    );
  });

  // -------- 副作用验证：持久化 --------

  it("注册成功后，save 被调用一次（新用户），支付由 financeService 处理", async () => {
    // 新用户通过 userRepository.save 持久化，Adam 的扣款由 financeService.transfer 处理
    const adam = createAdamUser();
    const deps = createMockDeps({
      systemAccountService: {
        getSystemAccount: vi.fn().mockResolvedValue(adam),
      },
    });

    await executeRegisterUserUseCase(validCommand, deps);

    expect(deps.userRepository.save).toHaveBeenCalledTimes(1);
  });

  // -------- 副作用验证：交易流水 --------

  it("注册成功后，financeService.transfer 包含正确的转账信息", async () => {
    const adam = createAdamUser();
    const deps = createMockDeps({
      systemAccountService: {
        getSystemAccount: vi.fn().mockResolvedValue(adam),
      },
    });

    const result = await executeRegisterUserUseCase(validCommand, deps);

    // Assert: transfer 包含正确的 payer、金额和类型
    expect(deps.financeService.transfer).toHaveBeenCalledWith(
      expect.objectContaining({
        payer: adam,
        amount: 10000,
        type: "registration_grant",
      }),
    );

    // Assert: transfer 的 receiver 是新注册的用户
    if (result.ok) {
      expect(deps.financeService.transfer).toHaveBeenCalledWith(
        expect.objectContaining({
          receiver: expect.objectContaining({ id: result.user.id }),
        }),
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
