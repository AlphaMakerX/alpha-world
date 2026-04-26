import { describe, it, expect } from "vitest";
import { Factory } from "@/server/features/factory/domain/entities/factory";

describe("Factory 实体", () => {
  it("rehydrate 创建工厂实体，读取正确的 subtype 和 level", () => {
    const factory = Factory.rehydrate({
      id: 1,
      plotId: 10,
      subtype: "mine",
      level: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(factory.subtype).toBe("mine");
    expect(factory.level).toBe(2);
    expect(factory.plotId).toBe(10);
  });

  it("upgrade() 将 level 从 1 升为 2", () => {
    const factory = Factory.rehydrate({
      id: 1,
      plotId: 10,
      subtype: "mine",
      level: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    factory.upgrade();
    expect(factory.level).toBe(2);
  });

  it("upgrade() 连续调用，level 从 1 升为 3", () => {
    const factory = Factory.rehydrate({
      id: 1,
      plotId: 10,
      subtype: "mine",
      level: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    factory.upgrade();
    factory.upgrade();
    expect(factory.level).toBe(3);
  });

  it("upgrade() 在 level=3 时抛出「已达最高等级」错误", () => {
    const factory = Factory.rehydrate({
      id: 1,
      plotId: 10,
      subtype: "mine",
      level: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(() => factory.upgrade()).toThrow("已达最高等级");
  });
});
