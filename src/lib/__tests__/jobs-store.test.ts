import { describe, it, expect, beforeEach } from "vitest";
import { getAllPublishedJobs, getAllOffers, createJob, toggleJobPublished, deleteJob } from "../jobs-store";
import type { Job } from "@/data/jobs";

// Ensure we're in localStorage mode (no NEXT_PUBLIC_API_URL)
beforeEach(() => {
  delete process.env.NEXT_PUBLIC_API_URL;
});

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: `job-${Date.now()}`,
    slug: "test-job",
    title: "Capitaine 500 UMS",
    company: "Test Maritime",
    companySlug: "test-maritime",
    location: "Lorient",
    zone: "bretagne",
    contractType: "CDI",
    category: "Pont",
    description: "Description du poste",
    profile: "Profil recherché",
    conditions: "Conditions",
    contactEmail: "test@gaspe.fr",
    publishedAt: "2026-01-01",
    published: true,
    ...overrides,
  };
}

describe("jobs-store (localStorage mode)", () => {
  describe("getAllPublishedJobs", () => {
    it("returns static jobs when no localStorage data", async () => {
      const jobs = await getAllPublishedJobs();
      // Should include static published jobs from data/jobs.ts
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs.every((j) => j.published)).toBe(true);
    });

    it("includes admin offers from localStorage", async () => {
      const adminJob = makeJob({ id: "admin-999", published: true });
      localStorage.setItem("gaspe_admin_offers", JSON.stringify([adminJob]));
      const jobs = await getAllPublishedJobs();
      expect(jobs.find((j) => j.id === "admin-999")).toBeDefined();
    });

    it("excludes unpublished admin offers", async () => {
      const draftJob = makeJob({ id: "admin-draft", published: false });
      localStorage.setItem("gaspe_admin_offers", JSON.stringify([draftJob]));
      const jobs = await getAllPublishedJobs();
      expect(jobs.find((j) => j.id === "admin-draft")).toBeUndefined();
    });

    it("deduplicates jobs by id", async () => {
      const dupeJob = makeJob({ id: "admin-dupe" });
      localStorage.setItem("gaspe_admin_offers", JSON.stringify([dupeJob, dupeJob]));
      const jobs = await getAllPublishedJobs();
      const dupes = jobs.filter((j) => j.id === "admin-dupe");
      expect(dupes).toHaveLength(1);
    });

    it("sorts by publishedAt descending", async () => {
      localStorage.setItem("gaspe_admin_offers", JSON.stringify([
        makeJob({ id: "old", publishedAt: "2020-01-01" }),
        makeJob({ id: "new", publishedAt: "2030-01-01" }),
      ]));
      const jobs = await getAllPublishedJobs();
      const oldIdx = jobs.findIndex((j) => j.id === "old");
      const newIdx = jobs.findIndex((j) => j.id === "new");
      expect(newIdx).toBeLessThan(oldIdx);
    });
  });

  describe("getAllOffers", () => {
    it("includes both published and draft offers", async () => {
      localStorage.setItem("gaspe_admin_offers", JSON.stringify([
        makeJob({ id: "pub", published: true }),
        makeJob({ id: "draft", published: false }),
      ]));
      const offers = await getAllOffers();
      expect(offers.find((j) => j.id === "pub")).toBeDefined();
      expect(offers.find((j) => j.id === "draft")).toBeDefined();
    });
  });

  describe("createJob", () => {
    it("adds job to localStorage", async () => {
      const job = makeJob({ id: "new-job-1" });
      const result = await createJob(job);
      expect(result).not.toBeNull();
      const stored = JSON.parse(localStorage.getItem("gaspe_admin_offers") ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("new-job-1");
    });

    it("appends to existing jobs", async () => {
      localStorage.setItem("gaspe_admin_offers", JSON.stringify([makeJob({ id: "existing" })]));
      await createJob(makeJob({ id: "new-job-2" }));
      const stored = JSON.parse(localStorage.getItem("gaspe_admin_offers") ?? "[]");
      expect(stored).toHaveLength(2);
    });
  });

  describe("toggleJobPublished", () => {
    it("toggles admin offer published state", async () => {
      localStorage.setItem("gaspe_admin_offers", JSON.stringify([
        makeJob({ id: "toggle-me", published: true }),
      ]));
      const result = await toggleJobPublished("toggle-me");
      expect(result).toBe(true);
      const stored = JSON.parse(localStorage.getItem("gaspe_admin_offers") ?? "[]");
      expect(stored[0].published).toBe(false);
    });

    it("returns false for unknown job id", async () => {
      const result = await toggleJobPublished("nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("deleteJob", () => {
    it("removes admin offer from localStorage", async () => {
      localStorage.setItem("gaspe_admin_offers", JSON.stringify([
        makeJob({ id: "keep" }),
        makeJob({ id: "delete-me" }),
      ]));
      const result = await deleteJob("delete-me");
      expect(result).toBe(true);
      const stored = JSON.parse(localStorage.getItem("gaspe_admin_offers") ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("keep");
    });
  });
});
