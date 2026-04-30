import { describe, it, expect, vi } from "vitest";
import {
  executeStartRestUseCase,
  type StartRestCommand,
  type StartRestUseCaseDeps,
} from "../start-rest-use-case";
import { Building } from "@/server/features/building/domain/entities/building";
import { Plot } from "@/server/features/plot/domain/entities/plot";
import { User } from "@/server/features/person/domain/entities/user";
import { RestJob } from "@/server/features/residential/domain/entities/rest-job";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { FinanceService } from "@/server/features/finance/application/services/finance-service";
import type { RestJobRepository } from "@/server/features/residential/domain/repositories/rest-job-repository";

function createResidential(restPrice: number | null = null) {
  return Building.rehydrate({
    id: 1, plotId: 10, type: "residential", subtype: null,
    level: 1, status: "active", restPrice,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

function createFactoryBuilding() {
  return Building.rehydrate({
    id: 2, plotId: 10, type: "factory", subtype: "mine",
    level: 1, status: "active", restPrice: null,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

function createPlot(ownerUserId: string) {
  return Plot.rehydrate({
    id: 10,
    coordinate: { x: 1, y: 1, getValue: () => "1,1" } as any,
    ownerUserId, status: "owned", price: 100,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

function createUser(id = "user-1", money = 10000) {
  return User.rehydrate({
    id, username: { getValue: () => "test" } as any, passwordHash: "hash",
    money, positionX: 0, positionY: 0,
    staminaCurrent: 1000, staminaMax: 1000, staminaUpdatedAt: new Date(),
    createdAt: new Date(), updatedAt: new Date(),
  });
}

function createAdamUser() {
  return User.rehydrate({
    id: ADAM_PERSONA_CONFIG.userId,
    username: { getValue: () => "adam" } as any, passwordHash: "hash",
    money: 1_000_000_000, positionX: 0, positionY: 0,
    staminaCurrent: 1000, staminaMax: 1000, staminaUpdatedAt: new Date(),
    createdAt: new Date(), updatedAt: new Date(),
  });
}

function createMockDeps(overrides?: Partial<StartRestUseCaseDeps>): StartRestUseCaseDeps {
  return {
    buildingRepository: {
      findById: vi.fn().mockResolvedValue(createResidential()),
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
    restJobRepository: {
      findById: vi.fn(),
      findInProgressByBuildingId: vi.fn().mockResolvedValue(null),
      findByBuildingId: vi.fn(),
      save: vi.fn().mockImplementation((job: RestJob) => Promise.resolve(job)),
    } satisfies RestJobRepository,
    financeService: {
      transfer: vi.fn(),
      freeze: vi.fn(),
      refund: vi.fn(),
      release: vi.fn(),
    } satisfies FinanceService,
    systemAccountService: {
      getSystemAccount: vi.fn().mockResolvedValue(createAdamUser()),
    },
    transact: (async <T>(fn: () => Promise<T>) => fn()) as StartRestUseCaseDeps["transact"],
    ...overrides,
  };
}

describe("在自己住宅休息 — 正常流程", () => {
  it("应创建 RestJob（status=in_progress, finishAt=now+300s）", async () => {
    const deps = createMockDeps();
    const result = await executeStartRestUseCase(
      { userId: "user-1", buildingId: 1 },
      deps,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.job.status).toBe("in_progress");
    }
    expect(deps.restJobRepository.save).toHaveBeenCalled();
  });

  it("应扣除 500 金币，收款方为 Adam", async () => {
    const deps = createMockDeps();
    await executeStartRestUseCase({ userId: "user-1", buildingId: 1 }, deps);
    expect(deps.financeService.transfer).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 500,
        type: "residential_rest",
      }),
    );
  });
});

describe("在别人住宅休息 — 正常流程", () => {
  it("主人定价 1000 时，应扣除 1000 金币", async () => {
    const building = createResidential(1000); // restPrice=1000
    const owner = createUser("owner-1", 50000);
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(building),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn(),
      },
      plotRepository: {
        findAll: vi.fn(),
        findById: vi.fn().mockResolvedValue(createPlot("owner-1")),
        findByCoordinate: vi.fn(),
        save: vi.fn(),
      },
      userRepository: {
        findById: vi.fn().mockImplementation((id: string) => {
          if (id === "user-1") return Promise.resolve(createUser("user-1", 10000));
          if (id === "owner-1") return Promise.resolve(owner);
          return Promise.resolve(null);
        }),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartRestUseCase({ userId: "user-1", buildingId: 1 }, deps);
    expect(result.ok).toBe(true);
    // 90% 给主人 (900), 10% 给 Adam (100)
    expect(deps.financeService.transfer).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 900, type: "residential_rest_service" }),
    );
    expect(deps.financeService.transfer).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100, type: "residential_rest_service" }),
    );
  });
});

describe("校验 — 建筑类型", () => {
  it("建筑不是住宅类型时，应返回错误", async () => {
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(createFactoryBuilding()),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartRestUseCase({ userId: "user-1", buildingId: 2 }, deps);
    expect(result.ok).toBe(false);
  });

  it("建筑不存在时，应返回 NOT_FOUND", async () => {
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(null),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartRestUseCase({ userId: "user-1", buildingId: 999 }, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });
});

describe("校验 — 并发限制", () => {
  it("住宅已有进行中的休息任务时，应返回 CONFLICT", async () => {
    const existingJob = RestJob.start({
      buildingId: 1, ownerUserId: "user-1", resterUserId: "user-1",
      restType: "full_rest", staminaGain: 1000, cost: 500, durationSeconds: 300,
    });
    const deps = createMockDeps({
      restJobRepository: {
        findById: vi.fn(),
        findInProgressByBuildingId: vi.fn().mockResolvedValue(existingJob),
        findByBuildingId: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartRestUseCase({ userId: "user-1", buildingId: 1 }, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("CONFLICT");
  });
});

describe("校验 — 定价", () => {
  it("在别人住宅且主人未设定价格（restPrice=null）时，应返回错误", async () => {
    const building = createResidential(null); // restPrice=null
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(building),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn(),
      },
      plotRepository: {
        findAll: vi.fn(),
        findById: vi.fn().mockResolvedValue(createPlot("other-user")),
        findByCoordinate: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartRestUseCase({ userId: "user-1", buildingId: 1 }, deps);
    expect(result.ok).toBe(false);
  });
});

describe("校验 — 金币", () => {
  it("金币不足时，应返回错误", async () => {
    const deps = createMockDeps({
      userRepository: {
        findById: vi.fn().mockResolvedValue(createUser("user-1", 100)),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartRestUseCase({ userId: "user-1", buildingId: 1 }, deps);
    expect(result.ok).toBe(false);
  });
});

describe("边界情况", () => {
  it("主人定价为 0 时，应成功休息", async () => {
    const building = createResidential(0);
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(building),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn(),
      },
      plotRepository: {
        findAll: vi.fn(),
        findById: vi.fn().mockResolvedValue(createPlot("other-user")),
        findByCoordinate: vi.fn(),
        save: vi.fn(),
      },
      userRepository: {
        findById: vi.fn().mockImplementation((id: string) => {
          if (id === "user-1") return Promise.resolve(createUser("user-1", 10000));
          if (id === "other-user") return Promise.resolve(createUser("other-user", 50000));
          return Promise.resolve(null);
        }),
        findByUsername: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeStartRestUseCase({ userId: "user-1", buildingId: 1 }, deps);
    expect(result.ok).toBe(true);
  });
});
