import { describe, it, expect } from "vitest";
import { Building } from "@/server/features/building/domain/entities/building";

describe("建造费用目录", () => {
  it("Building.getCost('factory', 'mine') 返回 800", () => {
    expect(Building.getCost("factory", "mine")).toBe(800);
  });

  it("Building.getCost('factory', 'assembler') 返回 1200", () => {
    expect(Building.getCost("factory", "assembler")).toBe(1200);
  });

  it("Building.getCost('factory', 'waterworks') 返回 600", () => {
    expect(Building.getCost("factory", "waterworks")).toBe(600);
  });

  it("Building.getCost('factory', 'lumber_mill') 返回 800", () => {
    expect(Building.getCost("factory", "lumber_mill")).toBe(800);
  });

  it("Building.getCost('factory', 'textile_mill') 返回 900", () => {
    expect(Building.getCost("factory", "textile_mill")).toBe(900);
  });

  it("Building.getCost('factory', 'ranch') 返回 900", () => {
    expect(Building.getCost("factory", "ranch")).toBe(900);
  });

  it("Building.getCost('factory', 'apothecary') 返回 900", () => {
    expect(Building.getCost("factory", "apothecary")).toBe(900);
  });

  it("Building.getCost('factory', 'smelter') 返回 1000", () => {
    expect(Building.getCost("factory", "smelter")).toBe(1000);
  });

  it("Building.getCost('factory', 'carpentry') 返回 1000", () => {
    expect(Building.getCost("factory", "carpentry")).toBe(1000);
  });

  it("Building.getCost('factory', 'paper_mill') 返回 1000", () => {
    expect(Building.getCost("factory", "paper_mill")).toBe(1000);
  });

  it("Building.getCost('residential') 返回 500（无 subtype）", () => {
    expect(Building.getCost("residential")).toBe(500);
  });

  it("Building.getCost('shop') 返回 600", () => {
    expect(Building.getCost("shop")).toBe(600);
  });
});
