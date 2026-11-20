import { describe, expect, it } from "vitest";
import { toAbsoluteUrl } from "../utils";

describe("safe URL normalisation", () => {
  it("normalises web addresses and local development hosts", () => {
    expect(toAbsoluteUrl("example.com")).toBe("https://example.com/");
    expect(toAbsoluteUrl("localhost:3000")).toBe("https://localhost:3000/");
    expect(toAbsoluteUrl("127.0.0.1:8080")).toBe("https://127.0.0.1:8080/");
    expect(toAbsoluteUrl("http://example.com/path")).toBe("http://example.com/path");
    expect(toAbsoluteUrl("https://example.com/path?q=1")).toBe("https://example.com/path?q=1");
  });

  it("rejects executable, local-file and non-web protocols", () => {
    expect(toAbsoluteUrl("javascript:alert(1)")).toBe("");
    expect(toAbsoluteUrl("javascript://alert(1)")).toBe("");
    expect(toAbsoluteUrl("data:text/html,hello")).toBe("");
    expect(toAbsoluteUrl("file:///etc/passwd")).toBe("");
    expect(toAbsoluteUrl("ftp://example.com")).toBe("");
    expect(toAbsoluteUrl("chrome://settings")).toBe("");
  });

  it("rejects malformed addresses and embedded credentials", () => {
    expect(toAbsoluteUrl("")).toBe("");
    expect(toAbsoluteUrl("https://")).toBe("");
    expect(toAbsoluteUrl("https://user:pass@example.com")).toBe("");
  });
});
