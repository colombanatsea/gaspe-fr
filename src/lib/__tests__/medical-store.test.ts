import { describe, it, expect, beforeEach } from "vitest";
import {
  getMedicalVisits,
  createMedicalVisit,
  updateMedicalVisit,
  deleteMedicalVisit,
  computeStatus,
} from "../medical-store";
import type { MedicalVisit } from "@/data/ssgm";

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_API_URL;
});

function makeVisit(overrides: Partial<MedicalVisit> = {}): MedicalVisit {
  return {
    id: `visit-${Date.now()}`,
    sailorName: "Jean Dupont",
    type: "aptitude_renouvellement",
    date: "2026-01-15",
    status: "scheduled",
    ...overrides,
  };
}

describe("computeStatus", () => {
  it("returns 'scheduled' for visit without expiry", () => {
    expect(computeStatus(makeVisit({ status: "scheduled" }))).toBe("scheduled");
  });

  it("returns 'completed' for completed visit without expiry", () => {
    expect(computeStatus(makeVisit({ status: "completed" }))).toBe("completed");
  });

  it("returns 'expired' for past expiry date", () => {
    const status = computeStatus(makeVisit({ expiryDate: "2020-01-01" }));
    expect(status).toBe("expired");
  });

  it("returns 'expiring_soon' for expiry within 60 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const status = computeStatus(makeVisit({ expiryDate: soon.toISOString().split("T")[0] }));
    expect(status).toBe("expiring_soon");
  });

  it("returns 'completed' for expiry far in future", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const status = computeStatus(makeVisit({ expiryDate: future.toISOString().split("T")[0] }));
    expect(status).toBe("completed");
  });
});

describe("medical-store (localStorage mode)", () => {
  describe("getMedicalVisits", () => {
    it("returns empty array when no visits stored", async () => {
      const visits = await getMedicalVisits();
      expect(visits).toEqual([]);
    });

    it("returns visits with recomputed status", async () => {
      const visit = makeVisit({ id: "v1", expiryDate: "2020-01-01", status: "completed" });
      localStorage.setItem("gaspe_medical_visits", JSON.stringify([visit]));
      const visits = await getMedicalVisits();
      expect(visits).toHaveLength(1);
      expect(visits[0].status).toBe("expired"); // Recomputed
    });
  });

  describe("createMedicalVisit", () => {
    it("adds visit to localStorage", async () => {
      const visit = makeVisit({ id: "new-v1" });
      const result = await createMedicalVisit(visit);
      expect(result).not.toBeNull();
      const stored = JSON.parse(localStorage.getItem("gaspe_medical_visits") ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("new-v1");
    });

    it("prepends new visits (most recent first)", async () => {
      await createMedicalVisit(makeVisit({ id: "first" }));
      await createMedicalVisit(makeVisit({ id: "second" }));
      const stored = JSON.parse(localStorage.getItem("gaspe_medical_visits") ?? "[]");
      expect(stored[0].id).toBe("second");
    });
  });

  describe("updateMedicalVisit", () => {
    it("updates existing visit", async () => {
      localStorage.setItem("gaspe_medical_visits", JSON.stringify([
        makeVisit({ id: "update-me", sailorName: "Old Name" }),
      ]));
      const result = await updateMedicalVisit("update-me", { sailorName: "New Name" });
      expect(result).toBe(true);
      const stored = JSON.parse(localStorage.getItem("gaspe_medical_visits") ?? "[]");
      expect(stored[0].sailorName).toBe("New Name");
    });

    it("returns false for non-existent visit", async () => {
      const result = await updateMedicalVisit("nonexistent", { sailorName: "Test" });
      expect(result).toBe(false);
    });
  });

  describe("deleteMedicalVisit", () => {
    it("removes visit from localStorage", async () => {
      localStorage.setItem("gaspe_medical_visits", JSON.stringify([
        makeVisit({ id: "keep" }),
        makeVisit({ id: "delete-me" }),
      ]));
      const result = await deleteMedicalVisit("delete-me");
      expect(result).toBe(true);
      const stored = JSON.parse(localStorage.getItem("gaspe_medical_visits") ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("keep");
    });
  });
});
