import { describe, it, expect, vi } from "vitest";
import {
  executeSetRestPriceUseCase,
  type SetRestPriceCommand,
  type SetRestPriceUseCaseDeps,
} from "../set-rest-price-use-case";
import { Building } from "@/server/features/building/domain/entities/building";
import { Plot } from "@/server/features/plot/domain/entities/plot";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";

function createResidential(restPrice: number | null = null) {
  return Building.rehydrate({
    id: 1,
    plotId: 10,
    type: "residential",
    subtype: null,
    level: 1,
    status: "active",
    restPrice,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createFactoryBuilding() {
  return Building.rehydrate({
    id: 2,
    plotId: 10,
    type: "factory",
    subtype: "mine",
    level: 1,
    status: "active",
    restPrice: null,
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

function createMockDeps(overrides?: Partial<SetRestPriceUseCaseDeps>): SetRestPriceUseCaseDeps {
  return {
    buildingRepository: {
      findById: vi.fn().mockResolvedValue(createResidential()),
      findByPlotId: vi.fn(),
      findByPlotIds: vi.fn(),
      findByOwnerUserId: vi.fn(),
      save: vi.fn().mockImplementation((b: Building) => Promise.resolve(b)),
    } satisfies BuildingRepository,
    plotRepository: {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(createPlot("user-1")),
      findByCoordinate: vi.fn(),
      save: vi.fn(),
    } satisfies PlotRepository,
    ...overrides,
  };
}

describe("设定休息价格用例", () => {
  it("住宅主人设定价格（800），应更新 restPrice", async () => {
    const building = createResidential();
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(building),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn().mockImplementation((b: Building) => Promise.resolve(b)),
      },
    });
    const result = await executeSetRestPriceUseCase(
      { userId: "user-1", buildingId: 1, price: 800 },
      deps,
    );
    expect(result.ok).toBe(true);
    expect(building.restPrice).toBe(800);
  });

  it("设定价格为 null，应关闭对外休息服务", async () => {
    const building = createResidential(500);
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(building),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn().mockImplementation((b: Building) => Promise.resolve(b)),
      },
    });
    const result = await executeSetRestPriceUseCase(
      { userId: "user-1", buildingId: 1, price: null },
      deps,
    );
    expect(result.ok).toBe(true);
    expect(building.restPrice).toBeNull();
  });

  it("设定价格为 0，应允许（免费开放）", async () => {
    const building = createResidential();
    const deps = createMockDeps({
      buildingRepository: {
        findById: vi.fn().mockResolvedValue(building),
        findByPlotId: vi.fn(),
        findByPlotIds: vi.fn(),
        findByOwnerUserId: vi.fn(),
        save: vi.fn().mockImplementation((b: Building) => Promise.resolve(b)),
      },
    });
    const result = await executeSetRestPriceUseCase(
      { userId: "user-1", buildingId: 1, price: 0 },
      deps,
    );
    expect(result.ok).toBe(true);
    expect(building.restPrice).toBe(0);
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
    const result = await executeSetRestPriceUseCase(
      { userId: "user-1", buildingId: 2, price: 500 },
      deps,
    );
    expect(result.ok).toBe(false);
  });

  it("调用者不是地块所有者时，应返回错误", async () => {
    const deps = createMockDeps({
      plotRepository: {
        findAll: vi.fn(),
        findById: vi.fn().mockResolvedValue(createPlot("other-user")),
        findByCoordinate: vi.fn(),
        save: vi.fn(),
      },
    });
    const result = await executeSetRestPriceUseCase(
      { userId: "user-1", buildingId: 1, price: 500 },
      deps,
    );
    expect(result.ok).toBe(false);
  });

  it("价格为负数时，应返回错误", async () => {
    const deps = createMockDeps();
    const result = await executeSetRestPriceUseCase(
      { userId: "user-1", buildingId: 1, price: -100 },
      deps,
    );
    expect(result.ok).toBe(false);
  });
});
