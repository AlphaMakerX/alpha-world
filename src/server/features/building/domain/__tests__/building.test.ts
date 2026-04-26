import { describe, it, expect } from "vitest";
import { Building } from "@/server/features/building/domain/entities/building";

describe("Building 实体 — subtype 与 level", () => {
  it("construct({ type: 'factory', subtype: 'mine' }) 创建的建筑 level=1、subtype='mine'", () => {
    const building = Building.construct({
      plotId: 10,
      type: "factory",
      subtype: "mine",
    });
    expect(building.level).toBe(1);
    expect(building.subtype).toBe("mine");
  });

  it("construct({ type: 'residential' }) 不传 subtype 正常创建，subtype 为 null", () => {
    const building = Building.construct({ plotId: 10, type: "residential" });
    expect(building.subtype).toBeNull();
    expect(building.level).toBe(1);
  });

  it("ensureShop() 对 shop 类型不抛错", () => {
    const building = Building.construct({ plotId: 10, type: "shop" });
    expect(() => building.ensureShop()).not.toThrow();
  });

  it("ensureShop() 对非 shop 类型抛出错误", () => {
    const building = Building.construct({ plotId: 10, type: "residential" });
    expect(() => building.ensureShop()).toThrow();
  });

  it("ensurePurchasingStation() 对 purchasing_station 类型不抛错", () => {
    const building = Building.construct({ plotId: 10, type: "purchasing_station" });
    expect(() => building.ensurePurchasingStation()).not.toThrow();
  });
});
