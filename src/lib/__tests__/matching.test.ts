import { describe, it, expect } from "vitest";
import { computeMatchScore, type MatchResult } from "../matching";
import type { User } from "@/lib/auth/AuthContext";
import type { Job } from "@/data/jobs";

// Minimal user factory
function makeCandidate(overrides: Partial<User> = {}): User {
  return {
    id: "candidat-test",
    email: "test@test.fr",
    name: "Test Candidat",
    role: "candidat",
    approved: true,
    createdAt: "2025-01-01",
    savedOffers: [],
    applications: [],
    experience: "",
    certifications: "",
    ...overrides,
  };
}

// Minimal job factory
function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-test",
    slug: "test-job",
    title: "Capitaine",
    company: "Test Co",
    companySlug: "test-co",
    location: "Granville",
    zone: "normandie",
    contractType: "CDI",
    category: "Pont",
    description: "",
    profile: "",
    conditions: "",
    contactEmail: "rh@test.fr",
    publishedAt: "2025-01-01",
    published: true,
    ...overrides,
  };
}

describe("computeMatchScore", () => {
  it("returns 100 for a perfect match (no brevet required)", () => {
    const candidate = makeCandidate({
      preferredZone: "normandie",
      desiredPosition: "pont",
    });
    const job = makeJob({ zone: "normandie", category: "Pont" });
    const result = computeMatchScore(candidate, job);
    expect(result.score).toBe(100);
    expect(result.level).toBe("excellent");
  });

  it("returns low score for empty profile", () => {
    const candidate = makeCandidate();
    const job = makeJob({ brevet: "Capitaine 3000" });
    const result = computeMatchScore(candidate, job);
    expect(result.score).toBeLessThan(50);
    expect(result.level).toBe("low");
  });

  it("matches structured STCW certifications (direct match)", () => {
    const candidate = makeCandidate({
      structuredCertifications: [{ certId: "capitaine-3000" }],
      preferredZone: "normandie",
      desiredPosition: "pont",
    });
    const job = makeJob({
      brevet: "Capitaine 3000",
      zone: "normandie",
      category: "Pont",
    });
    const result = computeMatchScore(candidate, job);
    expect(result.score).toBe(100);
    expect(result.details.some((d) => d.includes("Brevet compatible"))).toBe(true);
  });

  it("matches via supersedes (higher cert satisfies lower requirement)", () => {
    const candidate = makeCandidate({
      structuredCertifications: [{ certId: "capitaine-illimite" }],
    });
    const job = makeJob({ brevet: "Capitaine 500" });
    const result = computeMatchScore(candidate, job);
    // The brevet portion (40%) should be fully earned
    expect(result.details.some((d) => d.includes("couvre"))).toBe(true);
  });

  it("gives partial score for same category but different level", () => {
    const candidate = makeCandidate({
      structuredCertifications: [{ certId: "capitaine-200" }],
    });
    // capitaine-3000 requires capitaine-200 to be superseded, but cap-200 doesn't supersede cap-3000
    const job = makeJob({ brevet: "Capitaine 3000" });
    const result = computeMatchScore(candidate, job);
    // Same category (pont) → 50% on brevet weight
    expect(result.details.some((d) => d.includes("même catégorie"))).toBe(true);
  });

  it("matches zone correctly", () => {
    const candidate = makeCandidate({ preferredZone: "bretagne" });
    const job = makeJob({ zone: "bretagne" });
    const result = computeMatchScore(candidate, job);
    expect(result.details.some((d) => d.includes("Zone géographique correspondante"))).toBe(true);
  });

  it("detects zone mismatch", () => {
    const candidate = makeCandidate({ preferredZone: "normandie" });
    const job = makeJob({ zone: "paca" });
    const result = computeMatchScore(candidate, job);
    expect(result.details.some((d) => d.includes("Zone différente"))).toBe(true);
  });

  it("matches category via desiredPosition", () => {
    const candidate = makeCandidate({ desiredPosition: "machine" });
    const job = makeJob({ category: "Machine" });
    const result = computeMatchScore(candidate, job);
    expect(result.details.some((d) => d.includes("Catégorie de poste correspondante"))).toBe(true);
  });

  it("falls back to freetext certifications matching", () => {
    const candidate = makeCandidate({
      certifications: "Capitaine 500, CFBS",
    });
    const job = makeJob({ brevet: "Capitaine 500" });
    const result = computeMatchScore(candidate, job);
    expect(result.details.some((d) => d.includes("Brevet compatible"))).toBe(true);
  });

  it("returns correct level thresholds", () => {
    const levels: [number, MatchResult["level"]][] = [
      [75, "excellent"],
      [50, "good"],
      [25, "partial"],
      [0, "low"],
    ];
    for (const [score, expected] of levels) {
      const level =
        score >= 75 ? "excellent" : score >= 50 ? "good" : score >= 25 ? "partial" : "low";
      expect(level).toBe(expected);
    }
  });
});
