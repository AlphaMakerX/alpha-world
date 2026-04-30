import { describe, it, expect, vi } from "vitest";
import {
  executeStartFactoryProductionUseCase,
  type StartFactoryProductionCommand,
  type StartFactoryProductionUseCaseDeps,
} from "../start-factory-production-use-case";
import type { FactoryRepository } from "@/server/features/factory/domain/repositories/factory-repository";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { FinanceService } from "@/server/features/finance/application/services/finance-service";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { FactoryProductionJobRepository } from "@/server/features/factory/domain/repositories/factory-production-job-repository";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";
import { Factory } from "@/server/features/factory/domain/entities/factory";
import { FactoryProductionJob } from "@/server/features/factory/domain/entities/factory-production-job";
import { Plot } from "@/server/features/plot/domain/entities/plot";
import { User } from "@/server/features/person/domain/entities/user";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";

function createFactory() {
  return Factory.rehydrate({
    id: 100,
    plotId: 10,
    subtype: "mine",
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createPlot(ownerUserId: string) {
  return Plot.rehydrate({
    id: 10,
    coordinate: { x: 1, y: 1, getValue: () => "1,1" } as any,
    ownerUserId,
    status: "owned",
    price: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createUser(money = 10000, staminaCurrent = 1000) {
  return User.rehydrate({
    id: "user-1",
    username: { getValue: () => "owner" } as any,
    passwordHash: "hash",
    money,
    positionX: 0,
    positionY: 0,
    staminaCurrent,
    staminaMax: 1000,
    staminaUpdatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createAdamUser() {
  return User.rehydrate({
    id: ADAM_PERSONA_CONFIG.userId,
    username: { getValue: () => "adam" } as any,
    passwordHash: "hash",
    money: 1_000_000_000,
    positionX: 0,
    positionY: 0,
    staminaCurrent: 1000,
    staminaMax: 1000,
    staminaUpdatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createMockDeps(
  overrides?: Partial<StartFactoryProductionUseCaseDeps>,
): StartFactoryProductionUseCaseDeps {
  return {
    factoryRepository: {
      findByBuildingId: vi.fn().mockResolvedValue(createFactory()),
      save: vi.fn(),
    } satisfies FactoryRepository,
    buildingRepository: {
      findById: vi.fn(),
      findByPlotId: vi.fn(),
      findByPlotIds: vi.fn(),
      findByOwnerUserId: vi.fn(),
      save: vi.fn(),
    } satisfies BuildingRepository,
    factoryProductionJobRepository: {
      findById: vi.fn(),
      findInProgressByBuildingId: vi.fn().mockResolvedValue(null),
      findByBuildingId: vi.fn(),
      save: vi.fn().mockImplementation((job: FactoryProductionJob) => Promise.resolve(job)),
    } satisfies FactoryProductionJobRepository,
    inventoryRepository: {
      getByOwner: vi.fn(),
      getItemQuantity: vi.fn().mockResolvedValue(100),
      addItem: vi.fn(),
      consumeItem: vi.fn(),
    } satisfies InventoryRepository,
    plotRepository: {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(createPlot("user-1")),
      findByCoordinate: vi.fn(),
      save: vi.fn(),
    } satisfies PlotRepository,
    userRepository: {
      findById: vi.fn().mockResolvedValue(createUser()),
      findByUsername: vi.fn(),
      save: vi.fn(),
    } satisfies UserRepository,
    financeService: {
      transfer: vi.fn(),
      freeze: vi.fn(),
      refund: vi.fn(),
      release: vi.fn(),
    } satisfies FinanceService,
    unlockedRecipeRepository: {
      save: vi.fn(),
      saveBatch: vi.fn(),
      isUnlocked: vi.fn().mockResolvedValue(true),
      findByBuildingId: vi.fn(),
    } satisfies UnlockedRecipeRepository,
    systemAccountService: {
      getSystemAccount: vi.fn().mockResolvedValue(createAdamUser()),
    },
    transact: (async <T>(fn: () => Promise<T>) => fn()) as StartFactoryProductionUseCaseDeps["transact"],
    ...overrides,
  };
}

describe("启动生产用例 — 配方解锁校验", () => {
  it("已解锁配方：生产正常启动", async () => {
    const deps = createMockDeps();
    const command: StartFactoryProductionCommand = {
      ownerUserId: "user-1",
      buildingId: 100,
      recipeId: "buy_iron_ore",
      quantity: 1,
    };
    const result = await executeStartFactoryProductionUseCase(command, deps);
    expect(result.ok).toBe(true);
  });

  it("未解锁配方：返回错误「该工厂尚未解锁此配方」", async () => {
    const deps = createMockDeps({
      unlockedRecipeRepository: {
        save: vi.fn(),
        saveBatch: vi.fn(),
        isUnlocked: vi.fn().mockResolvedValue(false),
        findByBuildingId: vi.fn(),
      },
    });
    const command: StartFactoryProductionCommand = {
      ownerUserId: "user-1",
      buildingId: 100,
      recipeId: "buy_iron_ore",
      quantity: 1,
    };
    const result = await executeStartFactoryProductionUseCase(command, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("该工厂尚未解锁此配方");
    }
  });

  it("建筑不存在 → 错误", async () => {
    const deps = createMockDeps({
      factoryRepository: {
        findByBuildingId: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      },
    });
    const result = await executeStartFactoryProductionUseCase(
      { ownerUserId: "user-1", buildingId: 999, recipeId: "buy_iron_ore", quantity: 1 },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });

  it("配方不存在 → 错误", async () => {
    const deps = createMockDeps();
    const result = await executeStartFactoryProductionUseCase(
      { ownerUserId: "user-1", buildingId: 100, recipeId: "nonexistent", quantity: 1 },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });

  it("进行中任务 → 错误", async () => {
    const inProgressJob = FactoryProductionJob.start({
      id: 1, buildingId: 100, ownerUserId: "user-1",
      recipeId: "buy_iron_ore", inputs: [], outputs: [], durationSeconds: 10,
    });
    const deps = createMockDeps({
      factoryProductionJobRepository: {
        findById: vi.fn(),
        findInProgressByBuildingId: vi.fn().mockResolvedValue(inProgressJob),
        findByBuildingId: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartFactoryProductionUseCase(
      { ownerUserId: "user-1", buildingId: 100, recipeId: "buy_iron_ore", quantity: 1 },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("进行中");
  });

  it("非所有者 → 错误", async () => {
    const deps = createMockDeps({
      plotRepository: {
        findAll: vi.fn(),
        findById: vi.fn().mockResolvedValue(createPlot("other-user")),
        findByCoordinate: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartFactoryProductionUseCase(
      { ownerUserId: "user-1", buildingId: 100, recipeId: "buy_iron_ore", quantity: 1 },
      deps,
    );
    expect(result.ok).toBe(false);
  });

  it("余额不足 → 错误", async () => {
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(createUser(1)),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartFactoryProductionUseCase(
      { ownerUserId: "user-1", buildingId: 100, recipeId: "buy_iron_ore", quantity: 1 },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("余额不足");
  });
});

describe("启动生产用例 — 体力校验", () => {
  it("体力充足时启动生产（配方 10s × 1），应扣除体力 1（10×1×0.1）", async () => {
    const user = createUser(10000, 1000);
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(user),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const command: StartFactoryProductionCommand = {
      ownerUserId: "user-1",
      buildingId: 100,
      recipeId: "buy_iron_ore",  // 采购配方, durationSeconds=10
      quantity: 1,
    };
    const result = await executeStartFactoryProductionUseCase(command, deps);
    expect(result.ok).toBe(true);
    // 10s × 1 × 0.1 = 1 体力
    expect(user.staminaCurrent).toBeCloseTo(999);
  });

  it("体力充足时启动生产（配方 10s × 3），应扣除体力 3", async () => {
    const user = createUser(10000, 1000);
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(user),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartFactoryProductionUseCase(
      { ownerUserId: "user-1", buildingId: 100, recipeId: "buy_iron_ore", quantity: 3 },
      deps,
    );
    expect(result.ok).toBe(true);
    // 10s × 3 × 0.1 = 3 体力
    expect(user.staminaCurrent).toBeCloseTo(997);
  });

  it("体力恰好等于消耗量时，应成功启动生产", async () => {
    const user = createUser(10000, 1);  // 体力恰好 1
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(user),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartFactoryProductionUseCase(
      { ownerUserId: "user-1", buildingId: 100, recipeId: "buy_iron_ore", quantity: 1 },
      deps,
    );
    expect(result.ok).toBe(true);
    expect(user.staminaCurrent).toBeCloseTo(0);
  });

  it("体力不足时，应返回错误", async () => {
    const user = createUser(10000, 0.5);  // 体力 0.5，需要 1
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(user),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartFactoryProductionUseCase(
      { ownerUserId: "user-1", buildingId: 100, recipeId: "buy_iron_ore", quantity: 1 },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("体力不足");
  });

  it("体力不足时，不应创建生产任务", async () => {
    const user = createUser(10000, 0);
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(user),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    await executeStartFactoryProductionUseCase(
      { ownerUserId: "user-1", buildingId: 100, recipeId: "buy_iron_ore", quantity: 1 },
      deps,
    );
    expect(deps.factoryProductionJobRepository.save).not.toHaveBeenCalled();
  });
});
