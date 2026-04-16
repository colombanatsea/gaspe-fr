import { describe, it, expect, vi, beforeEach } from "vitest";
import { isApiMode } from "../api-client";

describe("api-client", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  describe("isApiMode", () => {
    it("returns false when NEXT_PUBLIC_API_URL is not set", () => {
      expect(isApiMode()).toBe(false);
    });

    it("returns true when NEXT_PUBLIC_API_URL is set", () => {
      process.env.NEXT_PUBLIC_API_URL = "https://api.gaspe.fr";
      expect(isApiMode()).toBe(true);
    });

    it("returns false for empty string", () => {
      process.env.NEXT_PUBLIC_API_URL = "";
      expect(isApiMode()).toBe(false);
    });
  });
});
