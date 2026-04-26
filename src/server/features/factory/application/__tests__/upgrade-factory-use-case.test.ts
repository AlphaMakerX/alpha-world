import { describe, it, expect, vi } from "vitest";
import {
  executeUpgradeFactoryUseCase,
  type UpgradeFactoryCommand,
  type UpgradeFactoryUseCaseDeps,
} from "../upgrade-factory-use-case";
import type { FactoryRepository } from "@/server/features/factory/domain/repositories/factory-repository";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import { Factory } from "@/server/features/factory/domain/entities/factory";
import { Plot } from "@/server/features/plot/domain/entities/plot";
import { User } from "@/server/features/person/domain/entities/user";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";

function createFactory(level = 1) {
  return Factory.rehydrate({
    id: 100,
    plotId: 10,
    subtype: "mine",
    level,
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
  overrides?: Partial<UpgradeFactoryUseCaseDeps>,
): UpgradeFactoryUseCaseDeps {
  return {
    factoryRepository: {
      findByBuildingId: vi.fn().mockResolvedValue(createFactory(1)),
      save: vi.fn().mockImplementation((f: Factory) => Promise.resolve(f)),
    } satisfies FactoryRepository,
    buildingRepository: {
      findById: vi.fn(),
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
    systemAccountService: {
      getSystemAccount: vi.fn().mockResolvedValue(createAdamUser()),
    },
    transact: (async <T>(fn: () => Promise<T>) => fn()) as UpgradeFactoryUseCaseDeps["transact"],
    ...overrides,
  };
}

const baseCommand: UpgradeFactoryCommand = {
  ownerUserId: "user-1",
  buildingId: 100,
};

describe("升级工厂用例", () => {
  it("成功 1→2：扣款 1000，level 变为 2", async () => {
    const deps = createMockDeps();
    const result = await executeUpgradeFactoryUseCase(baseCommand, deps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.building.level).toBe(2);
    }
    expect(deps.transactionLedgerRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1000 }),
    );
  });

  it("成功 2→3：扣款 3000，level 变为 3", async () => {
    const deps = createMockDeps({
      factoryRepository: {
        findByBuildingId: vi.fn().mockResolvedValue(createFactory(2)),
        save: vi.fn().mockImplementation((f: Factory) => Promise.resolve(f)),
      },
    });
    const result = await executeUpgradeFactoryUseCase(baseCommand, deps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.building.level).toBe(3);
    }
    expect(deps.transactionLedgerRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 3000 }),
    );
  });

  it("已达上限：level=3 → 错误「已达最高等级」", async () => {
    const deps = createMockDeps({
      factoryRepository: {
        findByBuildingId: vi.fn().mockResolvedValue(createFactory(3)),
        save: vi.fn(),
      },
    });
    const result = await executeUpgradeFactoryUseCase(baseCommand, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("已达最高等级");
    }
  });

  it("金币不足 → 错误", async () => {
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(createUser(500)),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeUpgradeFactoryUseCase(baseCommand, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("金币不足");
    }
  });

  it("非工厂建筑 → 错误", async () => {
    const deps = createMockDeps({
      factoryRepository: {
        findByBuildingId: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      },
    });
    const result = await executeUpgradeFactoryUseCase(baseCommand, deps);
    expect(result.ok).toBe(false);
  });

  it("建筑不存在 → 错误", async () => {
    const deps = createMockDeps({
      factoryRepository: {
        findByBuildingId: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      },
    });
    const result = await executeUpgradeFactoryUseCase(baseCommand, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NOT_FOUND");
    }
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
    const result = await executeUpgradeFactoryUseCase(baseCommand, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CONFLICT");
    }
  });
});
