import { describe, it, expect } from "vitest";
import type { UnlockedRecipeRepository } from "@/server/features/factory/domain/repositories/unlocked-recipe-repository";
import { InMemoryUnlockedRecipeRepository } from "@/server/features/factory/infrastructure/in-memory-unlocked-recipe-repository";

describe("UnlockedRecipeRepository", () => {
  function createRepo(): UnlockedRecipeRepository {
    return new InMemoryUnlockedRecipeRepository();
  }

  it("save 后 findByBuildingId 包含该 recipeId", async () => {
    const repo = createRepo();
    await repo.save(1, "buy_iron_ore");
    const recipes = await repo.findByBuildingId(1);
    expect(recipes).toContain("buy_iron_ore");
  });

  it("isUnlocked 已解锁返回 true，未解锁返回 false", async () => {
    const repo = createRepo();
    await repo.save(1, "buy_iron_ore");
    expect(await repo.isUnlocked(1, "buy_iron_ore")).toBe(true);
    expect(await repo.isUnlocked(1, "buy_wood")).toBe(false);
  });

  it("findByBuildingId 返回该工厂全部已解锁配方", async () => {
    const repo = createRepo();
    await repo.save(1, "buy_iron_ore");
    await repo.save(1, "buy_water");
    const recipes = await repo.findByBuildingId(1);
    expect(recipes).toHaveLength(2);
    expect(recipes).toContain("buy_iron_ore");
    expect(recipes).toContain("buy_water");
  });

  it("重复 save 同一 (buildingId, recipeId) 不报错（幂等）", async () => {
    const repo = createRepo();
    await repo.save(1, "buy_iron_ore");
    await expect(repo.save(1, "buy_iron_ore")).resolves.not.toThrow();
    const recipes = await repo.findByBuildingId(1);
    expect(recipes).toHaveLength(1);
  });

  it("saveBatch 批量写入多条记录", async () => {
    const repo = createRepo();
    await repo.saveBatch(1, ["buy_iron_ore", "buy_water", "kiln_brick"]);
    const recipes = await repo.findByBuildingId(1);
    expect(recipes).toHaveLength(3);
    expect(recipes).toContain("buy_iron_ore");
    expect(recipes).toContain("buy_water");
    expect(recipes).toContain("kiln_brick");
  });

  it("不同 buildingId 的记录互不影响", async () => {
    const repo = createRepo();
    await repo.save(1, "buy_iron_ore");
    await repo.save(2, "buy_wood");
    expect(await repo.findByBuildingId(1)).toEqual(["buy_iron_ore"]);
    expect(await repo.findByBuildingId(2)).toEqual(["buy_wood"]);
  });
});
