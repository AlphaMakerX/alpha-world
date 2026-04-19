import { describe, it, expect } from "vitest";
import { CryptoTokenGenerator } from "../crypto-token-generator";

describe("CryptoTokenGenerator", () => {
  const generator = new CryptoTokenGenerator();

  it("生成的明文以 awt_ 前缀开头", () => {
    const token = generator.generate();
    expect(token.startsWith("awt_")).toBe(true);
  });

  it("去前缀后是 base64url，且解码后恰好是 32 字节", () => {
    const token = generator.generate();
    const body = token.slice("awt_".length);

    // base64url 字符集：A-Z a-z 0-9 - _
    expect(/^[A-Za-z0-9_-]+$/.test(body)).toBe(true);

    // base64url 解码：Node 的 Buffer 原生支持
    const decoded = Buffer.from(body, "base64url");
    expect(decoded.length).toBe(32);
  });

  it("两次生成的明文不相等（来源于随机性）", () => {
    const a = generator.generate();
    const b = generator.generate();
    expect(a).not.toEqual(b);
  });
});
