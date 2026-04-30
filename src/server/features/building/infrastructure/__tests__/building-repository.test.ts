import { describe, it, expect } from "vitest";
import { Building } from "@/server/features/building/domain/entities/building";

describe("Building rehydrate — subtype 与 level 映射", () => {
  it("rehydrate 带 subtype 和 level 的 factory 建筑，读取出正确的 subtype 和 level", () => {
    const building = Building.rehydrate({
      id: 1,
      plotId: 10,
      type: "factory",
      subtype: "mine",
      level: 2,
      status: "active",
      restPrice: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(building.subtype).toBe("mine");
    expect(building.level).toBe(2);
    expect(building.type).toBe("factory");
  });

  it("rehydrate residential 建筑（subtype=null），subtype 为 null、level 为 1", () => {
    const building = Building.rehydrate({
      id: 2,
      plotId: 20,
      type: "residential",
      subtype: null,
      level: 1,
      status: "active",
      restPrice: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(building.subtype).toBeNull();
    expect(building.level).toBe(1);
  });
});
