import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Session } from "next-auth";

vi.mock("@/server/features/factory/composition", async () => {
  const { z } = await import("zod");
  return {
    executeListFactoryRecipesUseCase: vi.fn(),
    executeListFactoryOrdersUseCase: vi.fn(),
    executeStartFactoryProductionUseCase: vi.fn(),
    executeUnlockRecipeUseCase: vi.fn(),
    executeUpgradeFactoryUseCase: vi.fn(),
    listFactoryOrdersSchema: z.object({
      ownerUserId: z.string().uuid(),
      buildingId: z.number().int().positive(),
    }),
    startFactoryProductionSchema: z.object({
      ownerUserId: z.string().uuid(),
      buildingId: z.number().int().positive(),
      recipeId: z.string().min(1),
      quantity: z.number().int().min(1).max(100).default(1),
    }),
    unlockRecipeSchema: z.object({
      ownerUserId: z.string().uuid(),
      buildingId: z.number().int().positive(),
      recipeId: z.string().min(1),
    }),
    upgradeFactorySchema: z.object({
      ownerUserId: z.string().uuid(),
      buildingId: z.number().int().positive(),
    }),
    listFactoryRecipesSchema: z.object({
      buildingId: z.number().int().positive().optional(),
    }),
  };
});

import { createTRPCRouter } from "@/server/lib/trpc/core";
import { factoryRouter } from "@/server/lib/trpc/routers/factory";
import {
  executeUnlockRecipeUseCase,
  executeUpgradeFactoryUseCase,
  executeListFactoryRecipesUseCase,
} from "@/server/features/factory/composition";

const mockedUnlock = vi.mocked(executeUnlockRecipeUseCase);
const mockedUpgrade = vi.mocked(executeUpgradeFactoryUseCase);
const mockedRecipes = vi.mocked(executeListFactoryRecipesUseCase);

const router = createTRPCRouter({ factory: factoryRouter });

function makeCaller() {
  return router.createCaller({
    userId: "00000000-0000-0000-0000-000000000001",
    session: { user: { id: "u1" }, expires: "" } as Session,
    userRole: "user",
    tokenPresentButInvalid: false,
  });
}

describe("factory router — 新增接口", () => {
  beforeEach(() => {
    mockedUnlock.mockReset();
    mockedUpgrade.mockReset();
    mockedRecipes.mockReset();
  });

  it("unlockRecipe mutation 接受 { buildingId, recipeId }", async () => {
    mockedUnlock.mockResolvedValue({ ok: true });
    const caller = makeCaller();
    await caller.factory.unlockRecipe({ buildingId: 100, recipeId: "buy_iron_ore" });
    expect(mockedUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ buildingId: 100, recipeId: "buy_iron_ore" }),
    );
  });

  it("upgradeFactory mutation 接受 { buildingId }", async () => {
    mockedUpgrade.mockResolvedValue({ ok: true, building: { id: 100, level: 2 } });
    const caller = makeCaller();
    await caller.factory.upgradeFactory({ buildingId: 100 });
    expect(mockedUpgrade).toHaveBeenCalledWith(
      expect.objectContaining({ buildingId: 100 }),
    );
  });

  it("recipes query 接受可选 { buildingId }", async () => {
    mockedRecipes.mockResolvedValue({ ok: true, recipes: [], upgradePreview: null });
    const caller = makeCaller();
    await caller.factory.recipes({ buildingId: 100 });
    expect(mockedRecipes).toHaveBeenCalledWith(
      expect.objectContaining({ buildingId: 100 }),
    );
  });

  it("recipes query 不传 buildingId 也能调用", async () => {
    mockedRecipes.mockResolvedValue({ ok: true, recipes: [], upgradePreview: null });
    const caller = makeCaller();
    await caller.factory.recipes({});
    expect(mockedRecipes).toHaveBeenCalled();
  });
});
