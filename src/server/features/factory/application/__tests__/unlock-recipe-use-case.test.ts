import { describe, it, expect, vi } from "vitest";
import {
  executeUnlockRecipeUseCase,
  type UnlockRecipeCommand,
  type UnlockRecipeUseCaseDeps,
} from "../unlock-recipe-use-case";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";
import { Building } from "@/server/features/building/domain/entities/building";
import { Plot } from "@/server/features/plot/domain/entities/plot";
import { User } from "@/server/features/person/domain/entities/user";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";

function createMineFactory(level = 1) {
  return Building.rehydrate({
    id: 100,
    plotId: 10,
    type: "factory",
    subtype: "mine",
    level,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createShopBuilding() {
  return Building.rehydrate({
    id: 100,
    plotId: 10,
    type: "shop",
    subtype: null,
    level: 1,
    status: "active",
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

function createUser(money = 10000) {
  return User.rehydrate({
    id: "user-1",
    username: { getValue: () => "owner" } as any,
    passwordHash: "hash",
    money,
    positionX: 0,
    positionY: 0,
    staminaCurrent: 100,
    staminaMax: 100,
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
    staminaCurrent: 100,
    staminaMax: 100,
    staminaUpdatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createMockDeps(
  overrides?: Partial<UnlockRecipeUseCaseDeps>,
): UnlockRecipeUseCaseDeps {
  return {
    buildingRepository: {
      findById: vi.fn().mockResolvedValue(createMineFactory()),
      findByPlotId: vi.fn(),
      findByPlotIds: vi.fn(),
      findByOwnerUserId: vi.fn(),
      save: vi.fn(),
    } satisfies BuildingRepository,
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
    transactionLedgerRepository: {
      record: vi.fn(),
    } satisfies TransactionLedgerRepository,
    unlockedRecipeRepository: {
      save: vi.fn(),
      saveBatch: vi.fn(),
      isUnlocked: vi.fn().mockResolvedValue(false),
      findByBuildingId: vi.fn().mockResolvedValue([]),
    } satisfies UnlockedRecipeRepository,
    systemAccountService: {
      getSystemAccount: vi.fn().mockResolvedValue(createAdamUser()),
    },
    transact: (async <T>(fn: () => Promise<T>) => fn()) as UnlockRecipeUseCaseDeps["transact"],
    ...overrides,
  };
}

const baseCommand: UnlockRecipeCommand = {
  ownerUserId: "user-1",
  buildingId: 100,
  recipeId: "buy_iron_ore",
};

describe("解锁配方用例", () => {
  it("成功：mine 工厂 level=1 解锁 buy_iron_ore，扣款 50 金币", async () => {
    const deps = createMockDeps();
    const result = await executeUnlockRecipeUseCase(baseCommand, deps);
    expect(result.ok).toBe(true);
    expect(deps.unlockedRecipeRepository.save).toHaveBeenCalledWith(100, "buy_iron_ore");
    expect(deps.transactionLedgerRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 50 }),
    );
  });

  it("类型不匹配：mine 工厂尝试解锁 buy_wood → 错误", async () => {
    const deps = createMockDeps();
    const result = await executeUnlockRecipeUseCase(
      { ...baseCommand, recipeId: "buy_wood" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("该工厂类型无法使用此配方");
    }
  });

  it("等级不足：mine 工厂 level=1 解锁 kiln_brick（需 level 2）→ 错误", async () => {
    const deps = createMockDeps();
    const result = await executeUnlockRecipeUseCase(
      { ...baseCommand, recipeId: "kiln_brick" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("工厂等级不足");
    }
  });

  it("金币不足 → 错误", async () => {
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(createUser(10)),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeUnlockRecipeUseCase(baseCommand, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("金币不足");
    }
  });

  it("幂等：已解锁的配方再次请求 → 成功，不扣款", async () => {
    const deps = createMockDeps({
      unlockedRecipeRepository: {
        save: vi.fn(),
        saveBatch: vi.fn(),
        isUnlocked: vi.fn().mockResolvedValue(true),
        findByBuildingId: vi.fn().mockResolvedValue(["buy_iron_ore"]),
      },
    });
    const result = await executeUnlockRecipeUseCase(baseCommand, deps);
    expect(result.ok).toBe(true);
    expect(deps.transactionLedgerRepository.record).not.toHaveBeenCalled();
  });

  it("通用配方：mine 工厂解锁 buy_water → 成功", async () => {
    const deps = createMockDeps();
    const result = await executeUnlockRecipeUseCase(
      { ...baseCommand, recipeId: "buy_water" },
      deps,
    );
    expect(result.ok).toBe(true);
  });

  it("配方不存在：recipeId 无效 → 错误", async () => {
    const deps = createMockDeps();
    const result = await executeUnlockRecipeUseCase(
      { ...baseCommand, recipeId: "nonexistent_recipe" },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NOT_FOUND");
    }
  });

  it("建筑不存在：buildingId 无效 → 错误", async () => {
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(null),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeUnlockRecipeUseCase(baseCommand, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NOT_FOUND");
    }
  });

  it("非工厂建筑：建筑类型为 shop → 错误", async () => {
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(createShopBuilding()),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeUnlockRecipeUseCase(baseCommand, deps);
    expect(result.ok).toBe(false);
  });

  it("非所有者：非地块拥有者操作 → 错误", async () => {
    const deps = createMockDeps({
      plotRepository: {
        findAll: vi.fn(),
        findById: vi.fn().mockResolvedValue(createPlot("other-user")),
        findByCoordinate: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeUnlockRecipeUseCase(baseCommand, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CONFLICT");
    }
  });
});
