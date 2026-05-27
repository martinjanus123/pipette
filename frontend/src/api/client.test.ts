import { describe, expect, it } from "vitest";

import { buildApiUrl } from "./client";

describe("buildApiUrl", () => {
  it("builds allowed API URLs", () => {
    expect(buildApiUrl("/api/health")).toBe("http://localhost:8000/api/health");
  });

  it("encodes query parameters without path concatenation", () => {
    expect(buildApiUrl("/api/pipettes", { q: "SN 1/2" })).toBe(
      "http://localhost:8000/api/pipettes?q=SN+1%2F2",
    );
  });

  it("rejects non API paths", () => {
    expect(() => buildApiUrl("/profile")).toThrow("API path must start with /api/");
  });

  it("rejects path traversal", () => {
    expect(() => buildApiUrl("/api/../profile")).toThrow("API path is not allowed");
  });
});
