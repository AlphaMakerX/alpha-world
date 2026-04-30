import { describe, it, expect, vi } from "vitest";
import {
  executeListFactoryRecipesUseCase,
  type ListFactoryRecipesQuery,
  type ListFactoryRecipesUseCaseDeps,
} from "../list-factory-recipes-use-case";
import type { FactoryRepository } from "@/server/features/factory/domain/repositories/factory-repository";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";
import { Factory } from "@/server/features/factory/domain/entities/factory";

function createMineFactory(level = 2) {
  return Factory.rehydrate({
    id: 100,
    plotId: 10,
    subtype: "mine",
    level,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createMockDeps(
  overrides?: Partial<ListFactoryRecipesUseCaseDeps>,
): ListFactoryRecipesUseCaseDeps {
  return {
    factoryRepository: {
      findByBuildingId: vi.fn().mockResolvedValue(createMineFactory()),
      save: vi.fn(),
    } satisfies FactoryRepository,
    unlockedRecipeRepository: {
      save: vi.fn(),
      saveBatch: vi.fn(),
      isUnlocked: vi.fn(),
      findByBuildingId: vi.fn().mockResolvedValue(["buy_iron_ore", "buy_water"]),
    } satisfies UnlockedRecipeRepository,
    ...overrides,
  };
}

describe("查询工厂配方列表用例", () => {
  it("按工厂查询：mine level=2，返回 mine 类型 level≤2 的配方，标注 unlocked 和 staminaCostPerUnit", async () => {
    const deps = createMockDeps();
    const query: ListFactoryRecipesQuery = { buildingId: 100 };
    const result = await executeListFactoryRecipesUseCase(query, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 每条配方都有 unlocked 和 staminaCostPerUnit 字段
    for (const r of result.recipes) {
      expect(r).toHaveProperty("unlocked");
      expect(r).toHaveProperty("staminaCostPerUnit");
      expect(r.staminaCostPerUnit).toBe(r.durationSeconds * 0.1);
    }
    // 不含 level 3 的配方（requiredLevel > 2）
    for (const r of result.recipes) {
      expect(r.requiredLevel).toBeLessThanOrEqual(2);
    }
  });

  it("已解锁标注：buy_iron_ore unlocked=true，kiln_brick unlocked=false", async () => {
    const deps = createMockDeps();
    const query: ListFactoryRecipesQuery = { buildingId: 100 };
    const result = await executeListFactoryRecipesUseCase(query, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ironOre = result.recipes.find((r) => r.id === "buy_iron_ore");
    expect(ironOre?.unlocked).toBe(true);
    const kilnBrick = result.recipes.find((r) => r.id === "kiln_brick");
    expect(kilnBrick?.unlocked).toBe(false);
  });

  it("通用配方包含：返回列表中包含 buy_water", async () => {
    const deps = createMockDeps();
    const query: ListFactoryRecipesQuery = { buildingId: 100 };
    const result = await executeListFactoryRecipesUseCase(query, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const water = result.recipes.find((r) => r.id === "buy_water");
    expect(water).toBeDefined();
  });

  it("不含其他类型配方：mine 查询不返回 buy_wood", async () => {
    const deps = createMockDeps();
    const query: ListFactoryRecipesQuery = { buildingId: 100 };
    const result = await executeListFactoryRecipesUseCase(query, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const wood = result.recipes.find((r) => r.id === "buy_wood");
    expect(wood).toBeUndefined();
  });

  it("无 buildingId 查询：返回全量 55 条配方", async () => {
    const deps = createMockDeps();
    const query: ListFactoryRecipesQuery = {};
    const result = await executeListFactoryRecipesUseCase(query, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipes).toHaveLength(55);
  });
});
