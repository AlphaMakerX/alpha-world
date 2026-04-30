import { describe, it, expect, vi } from "vitest";
import {
  executeCollectRestUseCase,
  type CollectRestUseCaseDeps,
} from "../collect-rest-use-case";
import { RestJob } from "@/server/features/residential/domain/entities/rest-job";
import { User } from "@/server/features/person/domain/entities/user";
import type { RestJobRepository } from "@/server/features/residential/domain/repositories/rest-job-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";

function createUser(staminaCurrent = 0) {
  return User.rehydrate({
    id: "rester-1",
    username: { getValue: () => "test" } as any,
    passwordHash: "hash",
    money: 10000,
    positionX: 0,
    positionY: 0,
    staminaCurrent,
    staminaMax: 1000,
    staminaUpdatedAt: new Date("2026-01-01T00:00:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
}

function createCompletedRestJob() {
  const job = RestJob.rehydrate({
    id: 42,
    buildingId: 1,
    ownerUserId: "owner-1",
    resterUserId: "rester-1",
    restType: "full_rest",
    staminaGain: 1000,
    cost: 500,
    status: "in_progress",
    startedAt: new Date("2026-01-01T00:00:00Z"),
    finishAt: new Date("2026-01-01T00:05:00Z"),
    collectedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
  return job;
}

function createCollectedRestJob() {
  return RestJob.rehydrate({
    id: 42,
    buildingId: 1,
    ownerUserId: "owner-1",
    resterUserId: "rester-1",
    restType: "full_rest",
    staminaGain: 1000,
    cost: 500,
    status: "collected",
    startedAt: new Date("2026-01-01T00:00:00Z"),
    finishAt: new Date("2026-01-01T00:05:00Z"),
    collectedAt: new Date("2026-01-01T00:06:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:06:00Z"),
  });
}

function createMockDeps(overrides?: Partial<CollectRestUseCaseDeps>): CollectRestUseCaseDeps {
  return {
    restJobRepository: {
      findById: vi.fn().mockResolvedValue(createCompletedRestJob()),
      findInProgressByBuildingId: vi.fn(),
      findByBuildingId: vi.fn(),
      save: vi.fn().mockImplementation((job: RestJob) => Promise.resolve(job)),
    } satisfies RestJobRepository,
    userRepository: {
      findById: vi.fn().mockResolvedValue(createUser(0)),
      findByUsername: vi.fn(),
      save: vi.fn(),
    } satisfies UserRepository,
    transact: (async <T>(fn: () => Promise<T>) => fn()) as CollectRestUseCaseDeps["transact"],
    ...overrides,
  };
}

describe("收取休息 — 正常流程", () => {
  it("休息任务已完成时，应恢复体力并标记 collected", async () => {
    const user = createUser(0);
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(user),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    // now 在 finishAt 之后
    const result = await executeCollectRestUseCase(
      { userId: "rester-1", jobId: 42, now: new Date("2026-01-01T00:06:00Z") },
      deps,
    );
    expect(result.ok).toBe(true);
    // 体力应恢复到 1000（截断到 max）
    expect(user.staminaCurrent).toBe(1000);
    expect(deps.restJobRepository.save).toHaveBeenCalled();
    expect(deps.userRepository.save).toHaveBeenCalled();
  });

  it("恢复后体力超过上限时，应截断至 staminaMax", async () => {
    const user = createUser(500);
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(user),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeCollectRestUseCase(
      { userId: "rester-1", jobId: 42, now: new Date("2026-01-01T00:06:00Z") },
      deps,
    );
    expect(result.ok).toBe(true);
    expect(user.staminaCurrent).toBe(1000);
  });
});

describe("收取休息 — 校验", () => {
  it("job 不存在时，应返回 NOT_FOUND", async () => {
    const deps = createMockDeps({
      restJobRepository: {
        findById: vi.fn().mockResolvedValue(null),
        findInProgressByBuildingId: vi.fn(),
        findByBuildingId: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeCollectRestUseCase(
      { userId: "rester-1", jobId: 999, now: new Date() },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });

  it("调用者不是休息发起人时，应返回错误", async () => {
    const deps = createMockDeps();
    const result = await executeCollectRestUseCase(
      { userId: "other-user", jobId: 42, now: new Date("2026-01-01T00:06:00Z") },
      deps,
    );
    expect(result.ok).toBe(false);
  });

  it("job 尚未完成（now < finishAt）时，应返回错误", async () => {
    const deps = createMockDeps();
    const result = await executeCollectRestUseCase(
      { userId: "rester-1", jobId: 42, now: new Date("2026-01-01T00:01:00Z") },
      deps,
    );
    expect(result.ok).toBe(false);
  });

  it("job 已收取过（status=collected）时，应返回错误", async () => {
    const deps = createMockDeps({
      restJobRepository: {
        findById: vi.fn().mockResolvedValue(createCollectedRestJob()),
        findInProgressByBuildingId: vi.fn(),
        findByBuildingId: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeCollectRestUseCase(
      { userId: "rester-1", jobId: 42, now: new Date("2026-01-01T00:07:00Z") },
      deps,
    );
    expect(result.ok).toBe(false);
  });
});
