import { describe, it, expect } from "vitest";
import { getBuildingCost } from "@/server/features/building/application/building-cost-catalog";

describe("建造费用目录", () => {
  it("getBuildingCost('factory', 'mine') 返回 800", () => {
    expect(getBuildingCost("factory", "mine")).toBe(800);
  });

  it("getBuildingCost('factory', 'assembler') 返回 1200", () => {
    expect(getBuildingCost("factory", "assembler")).toBe(1200);
  });

  it("getBuildingCost('factory', 'waterworks') 返回 600", () => {
    expect(getBuildingCost("factory", "waterworks")).toBe(600);
  });

  it("getBuildingCost('factory', 'lumber_mill') 返回 800", () => {
    expect(getBuildingCost("factory", "lumber_mill")).toBe(800);
  });

  it("getBuildingCost('factory', 'textile_mill') 返回 900", () => {
    expect(getBuildingCost("factory", "textile_mill")).toBe(900);
  });

  it("getBuildingCost('factory', 'ranch') 返回 900", () => {
    expect(getBuildingCost("factory", "ranch")).toBe(900);
  });

  it("getBuildingCost('factory', 'apothecary') 返回 900", () => {
    expect(getBuildingCost("factory", "apothecary")).toBe(900);
  });

  it("getBuildingCost('factory', 'smelter') 返回 1000", () => {
    expect(getBuildingCost("factory", "smelter")).toBe(1000);
  });

  it("getBuildingCost('factory', 'carpentry') 返回 1000", () => {
    expect(getBuildingCost("factory", "carpentry")).toBe(1000);
  });

  it("getBuildingCost('factory', 'paper_mill') 返回 1000", () => {
    expect(getBuildingCost("factory", "paper_mill")).toBe(1000);
  });

  it("getBuildingCost('residential') 返回 500（无 subtype）", () => {
    expect(getBuildingCost("residential")).toBe(500);
  });

  it("getBuildingCost('shop') 返回 600", () => {
    expect(getBuildingCost("shop")).toBe(600);
  });
});
