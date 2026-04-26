import { describe, it, expect, vi } from "vitest";
import {
  executeBuildBuildingUseCase,
  type BuildBuildingCommand,
  type BuildBuildingUseCaseDeps,
} from "../build-building-use-case";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import { Plot } from "@/server/features/plot/domain/entities/plot";
import { User } from "@/server/features/person/domain/entities/user";
import { Building } from "@/server/features/building/domain/entities/building";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";

function createOwnerPlot(ownerUserId: string) {
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

function createOwnerUser(money = 10000) {
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
  overrides?: Partial<BuildBuildingUseCaseDeps>,
): BuildBuildingUseCaseDeps {
  return {
    plotRepository: {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(createOwnerPlot("user-1")),
      findByCoordinate: vi.fn(),
      save: vi.fn(),
    } satisfies PlotRepository,
    buildingRepository: {
      findById: vi.fn(),
      findByPlotId: vi.fn().mockResolvedValue(null),
      findByPlotIds: vi.fn(),
      findByOwnerUserId: vi.fn(),
      save: vi.fn().mockImplementation((b: Building) => Promise.resolve(b)),
    } satisfies BuildingRepository,
    userRepository: {
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === ADAM_PERSONA_CONFIG.userId) return Promise.resolve(createAdamUser());
        return Promise.resolve(createOwnerUser());
      }),
      findByUsername: vi.fn(),
      save: vi.fn(),
    } satisfies UserRepository,
    transactionLedgerRepository: {
      record: vi.fn(),
    } satisfies TransactionLedgerRepository,
    systemAccountService: {
      getSystemAccount: vi.fn().mockResolvedValue(createAdamUser()),
    },
    transact: (async <T>(fn: () => Promise<T>) => fn()) as BuildBuildingUseCaseDeps["transact"],
    afterBuildHook: vi.fn(),
    ...overrides,
  };
}

describe("建造建筑用例 — 工厂子类型", () => {
  it("建造工厂时传入 factorySubtype: 'mine'，成功返回 building 包含 subtype 和 level=1", async () => {
    const deps = createMockDeps();
    const command: BuildBuildingCommand = {
      ownerUserId: "user-1",
      plotId: 10,
      buildingType: "factory",
      factorySubtype: "mine",
    };
    const result = await executeBuildBuildingUseCase(command, deps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.building.subtype).toBe("mine");
      expect(result.building.level).toBe(1);
    }
  });

  it("建造工厂时不传 factorySubtype，返回错误", async () => {
    const deps = createMockDeps();
    const command: BuildBuildingCommand = {
      ownerUserId: "user-1",
      plotId: 10,
      buildingType: "factory",
    };
    const result = await executeBuildBuildingUseCase(command, deps);
    expect(result.ok).toBe(false);
  });

  // 注：无效 subtype 的校验已移至 composition 层的 zod schema（isValidFactorySubtype）

  it("建造 residential 时不传 subtype，正常成功", async () => {
    const deps = createMockDeps();
    const command: BuildBuildingCommand = {
      ownerUserId: "user-1",
      plotId: 10,
      buildingType: "residential",
    };
    const result = await executeBuildBuildingUseCase(command, deps);
    expect(result.ok).toBe(true);
  });

  it("建造 mine 扣费 800，建造 assembler 扣费 1200", async () => {
    const deps1 = createMockDeps();
    await executeBuildBuildingUseCase(
      { ownerUserId: "user-1", plotId: 10, buildingType: "factory", factorySubtype: "mine" },
      deps1,
    );
    expect(deps1.transactionLedgerRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 800 }),
    );

    const deps2 = createMockDeps();
    await executeBuildBuildingUseCase(
      { ownerUserId: "user-1", plotId: 10, buildingType: "factory", factorySubtype: "assembler" },
      deps2,
    );
    expect(deps2.transactionLedgerRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1200 }),
    );
  });
});
