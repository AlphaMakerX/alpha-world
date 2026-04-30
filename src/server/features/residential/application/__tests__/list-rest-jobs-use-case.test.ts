import { describe, it, expect, vi } from "vitest";
import {
  executeListRestJobsUseCase,
  type ListRestJobsUseCaseDeps,
} from "../list-rest-jobs-use-case";
import { Building } from "@/server/features/building/domain/entities/building";
import { RestJob } from "@/server/features/residential/domain/entities/rest-job";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { RestJobRepository } from "@/server/features/residential/domain/repositories/rest-job-repository";

function createResidential() {
  return Building.rehydrate({
    id: 1, plotId: 10, type: "residential", subtype: null,
    level: 1, status: "active", restPrice: null,
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

function createRestJobData(status: "in_progress" | "collected" = "in_progress") {
  const now = new Date();
  return RestJob.rehydrate({
    id: Math.floor(Math.random() * 1000),
    buildingId: 1, ownerUserId: "owner-1", resterUserId: "rester-1",
    restType: "full_rest", staminaGain: 1000, cost: 500,
    status,
    startedAt: now, finishAt: new Date(now.getTime() + 300_000),
    collectedAt: status === "collected" ? now : null,
    createdAt: now, updatedAt: now,
  });
}

function createMockDeps(overrides?: Partial<ListRestJobsUseCaseDeps>): ListRestJobsUseCaseDeps {
  return {
    buildingRepository: {
      findById: vi.fn().mockResolvedValue(createResidential()),
      findByPlotId: vi.fn(),
      findByPlotIds: vi.fn(),
      findByOwnerUserId: vi.fn(),
      save: vi.fn(),
    } satisfies BuildingRepository,
    restJobRepository: {
      findById: vi.fn(),
      findInProgressByBuildingId: vi.fn(),
      findByBuildingId: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
    } satisfies RestJobRepository,
    ...overrides,
  };
}

describe("查询休息任务 — 正常流程", () => {
  it("住宅有 1 个进行中 + 2 个已收取的任务时，应全部返回", async () => {
    const jobs = [
      createRestJobData("in_progress"),
      createRestJobData("collected"),
      createRestJobData("collected"),
    ];
    const deps = createMockDeps({
      restJobRepository: {
        findById: vi.fn(),
        findInProgressByBuildingId: vi.fn(),
        findByBuildingId: vi.fn().mockResolvedValue(jobs),
        save: vi.fn(),
      },
    });
    const result = await executeListRestJobsUseCase({ buildingId: 1 }, deps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jobs).toHaveLength(3);
    }
  });

  it("住宅无任何休息任务时，应返回空列表", async () => {
    const deps = createMockDeps();
    const result = await executeListRestJobsUseCase({ buildingId: 1 }, deps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jobs).toHaveLength(0);
    }
  });
});

describe("查询休息任务 — 校验", () => {
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
    const result = await executeListRestJobsUseCase({ buildingId: 999 }, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });

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
    const result = await executeListRestJobsUseCase({ buildingId: 2 }, deps);
    expect(result.ok).toBe(false);
  });
});
