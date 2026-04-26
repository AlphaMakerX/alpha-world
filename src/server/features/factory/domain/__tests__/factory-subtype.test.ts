import { describe, it, expect } from "vitest";
import {
  FACTORY_SUBTYPES,
  isValidFactorySubtype,
  MAX_FACTORY_LEVEL,
} from "@/server/features/factory/domain/factory-subtype";

describe("FactorySubtype", () => {
  it("FACTORY_SUBTYPES 应包含全部 10 种类型", () => {
    expect(FACTORY_SUBTYPES).toHaveLength(10);
    expect(FACTORY_SUBTYPES).toContain("mine");
    expect(FACTORY_SUBTYPES).toContain("lumber_mill");
    expect(FACTORY_SUBTYPES).toContain("textile_mill");
    expect(FACTORY_SUBTYPES).toContain("ranch");
    expect(FACTORY_SUBTYPES).toContain("apothecary");
    expect(FACTORY_SUBTYPES).toContain("waterworks");
    expect(FACTORY_SUBTYPES).toContain("smelter");
    expect(FACTORY_SUBTYPES).toContain("carpentry");
    expect(FACTORY_SUBTYPES).toContain("paper_mill");
    expect(FACTORY_SUBTYPES).toContain("assembler");
  });

  it("isValidFactorySubtype('mine') 应返回 true", () => {
    expect(isValidFactorySubtype("mine")).toBe(true);
  });

  it("isValidFactorySubtype('invalid_type') 应返回 false", () => {
    expect(isValidFactorySubtype("invalid_type")).toBe(false);
  });

  it("MAX_FACTORY_LEVEL 应为 3", () => {
    expect(MAX_FACTORY_LEVEL).toBe(3);
  });
});
