import { describe, it, expect, vi } from "vitest";
import { autoUnlockDefaultRecipes } from "../services/auto-unlock-default-recipes";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";

function createMockRepo(): UnlockedRecipeRepository {
  return {
    save: vi.fn(),
    saveBatch: vi.fn(),
    isUnlocked: vi.fn(),
    findByBuildingId: vi.fn(),
  };
}

describe("自动解锁默认配方", () => {
  it("mine 工厂：saveBatch 参数包含 buy_iron_ore 和 buy_water", async () => {
    const repo = createMockRepo();
    await autoUnlockDefaultRecipes(1, "mine", repo);
    expect(repo.saveBatch).toHaveBeenCalledWith(
      1,
      expect.arrayContaining(["buy_iron_ore", "buy_water"]),
    );
  });

  it("waterworks 工厂：saveBatch 参数包含 buy_water 和 buy_water_bulk", async () => {
    const repo = createMockRepo();
    await autoUnlockDefaultRecipes(2, "waterworks", repo);
    expect(repo.saveBatch).toHaveBeenCalledWith(
      2,
      expect.arrayContaining(["buy_water", "buy_water_bulk"]),
    );
  });

  it("assembler 工厂：saveBatch 参数仅包含 buy_water", async () => {
    const repo = createMockRepo();
    await autoUnlockDefaultRecipes(3, "assembler", repo);
    const callArgs = (repo.saveBatch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toBe(3);
    expect(callArgs[1]).toContain("buy_water");
    expect(callArgs[1]).not.toContain("buy_iron_ore");
    expect(callArgs[1]).not.toContain("buy_wood");
  });
});
