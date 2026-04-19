import { describe, it, expect } from "vitest";
import { Sha256TokenHasher } from "../sha256-token-hasher";

describe("Sha256TokenHasher", () => {
  const hasher = new Sha256TokenHasher();

  it("同一明文每次 hash 结果稳定", () => {
    const h1 = hasher.hash("awt_some-plain-token");
    const h2 = hasher.hash("awt_some-plain-token");
    expect(h1).toEqual(h2);
  });

  it("不同明文的 hash 结果不同", () => {
    const h1 = hasher.hash("awt_token-a");
    const h2 = hasher.hash("awt_token-b");
    expect(h1).not.toEqual(h2);
  });

  it("输出为 64 位小写十六进制字符串", () => {
    const h = hasher.hash("any-input");
    expect(h.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(h)).toBe(true);
  });

  it("对已知明文，hash 与标准 SHA-256 结果一致", () => {
    // 独立算出的期望值（标准 SHA-256 of "abc"）
    const expected =
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    expect(hasher.hash("abc")).toEqual(expected);
  });
});
