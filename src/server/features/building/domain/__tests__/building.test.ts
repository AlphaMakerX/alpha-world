import { describe, it, expect } from "vitest";
import { Building } from "@/server/features/building/domain/entities/building";

describe("Building 实体 — subtype 与 level", () => {
  it("construct({ type: 'factory', subtype: 'mine' }) 创建的建筑 level=1、subtype='mine'", () => {
    const building = Building.construct({
      id: 1,
      plotId: 10,
      type: "factory",
      subtype: "mine",
    });
    expect(building.level).toBe(1);
    expect(building.subtype).toBe("mine");
  });

  it("construct({ type: 'factory' }) 不传 subtype 时抛出错误", () => {
    expect(() =>
      Building.construct({ id: 1, plotId: 10, type: "factory" }),
    ).toThrow();
  });

  it("construct({ type: 'residential' }) 不传 subtype 正常创建，subtype 为 null", () => {
    const building = Building.construct({ id: 1, plotId: 10, type: "residential" });
    expect(building.subtype).toBeNull();
    expect(building.level).toBe(1);
  });

  it("upgrade() 将 level 从 1 升为 2", () => {
    const building = Building.construct({
      id: 1,
      plotId: 10,
      type: "factory",
      subtype: "mine",
    });
    building.upgrade();
    expect(building.level).toBe(2);
  });

  it("upgrade() 连续调用，level 从 2 升为 3", () => {
    const building = Building.construct({
      id: 1,
      plotId: 10,
      type: "factory",
      subtype: "mine",
    });
    building.upgrade();
    building.upgrade();
    expect(building.level).toBe(3);
  });

  it("upgrade() 在 level=3 时抛出「已达最高等级」错误", () => {
    const building = Building.construct({
      id: 1,
      plotId: 10,
      type: "factory",
      subtype: "mine",
    });
    building.upgrade();
    building.upgrade();
    expect(() => building.upgrade()).toThrow("已达最高等级");
  });

  it("非 factory 类型调用 upgrade() 抛出错误", () => {
    const building = Building.construct({ id: 1, plotId: 10, type: "residential" });
    expect(() => building.upgrade()).toThrow();
  });

  it("ensureFactory() 成功时返回 subtype", () => {
    const building = Building.construct({
      id: 1,
      plotId: 10,
      type: "factory",
      subtype: "smelter",
    });
    expect(building.ensureFactory()).toBe("smelter");
  });
});
