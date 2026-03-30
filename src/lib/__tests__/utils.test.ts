import { describe, it, expect } from "vitest";
import { slugify, formatDate } from "../utils";

describe("slugify", () => {
  it("converts to lowercase and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes accents", () => {
    expect(slugify("Mécanicien Élevé")).toBe("mecanicien-eleve");
  });

  it("strips non-alphanumeric chars", () => {
    expect(slugify("Manche Iles Express (DNO)")).toBe("manche-iles-express-dno");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a   b   c")).toBe("a-b-c");
  });

  it("handles French company names", () => {
    expect(slugify("Bacs de l'Île de Ré")).toBe("bacs-de-l-ile-de-re");
    expect(slugify("Karu'Ferry")).toBe("karu-ferry");
  });
});

describe("formatDate", () => {
  it("formats a date string in French", () => {
    const result = formatDate("2025-03-15");
    expect(result).toContain("mars");
    expect(result).toContain("2025");
    expect(result).toContain("15");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-12-25"));
    expect(result).toContain("décembre");
    expect(result).toContain("2024");
  });
});
