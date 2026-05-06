import { describe, expect, it } from "vitest";
import { normalizeApiUrl } from "./normalizeApiUrl";

describe("normalizeApiUrl", () => {
  it("appends /api when missing", () => {
    expect(normalizeApiUrl("http://localhost:1234"))
      .toBe("http://localhost:1234/api");
  });

  it("removes trailing slashes and duplicate /api", () => {
    expect(normalizeApiUrl("http://example.com/api//"))
      .toBe("http://example.com/api");
  });

  it("trims whitespace", () => {
    expect(normalizeApiUrl("  https://demo.local/  "))
      .toBe("https://demo.local/api");
  });

  it("throws on empty input", () => {
    expect(() => normalizeApiUrl("   "))
      .toThrowError(/required/);
  });
});
