import { describe, it, expect } from "vitest";
import { computeProfileCompleteness } from "../profile-completeness";
import type { Member, FleetVessel } from "@/types";

const baseMember: Member = {
  name: "Test Co",
  slug: "test-co",
  city: "Brest",
  latitude: 48,
  longitude: -4,
  region: "Bretagne",
  territory: "metropole",
  category: "titulaire",
  college: "A",
  social3228: true,
};

describe("computeProfileCompleteness", () => {
  it("returns 0% for an empty company A profile with no fleet", () => {
    const r = computeProfileCompleteness({ user: {}, member: baseMember, fleet: [], college: "A" });
    expect(r.total).toBe(0);
    expect(r.isComplete).toBe(false);
    expect(r.missingPct).toBe(100);
    expect(r.sections).toHaveLength(6);
  });

  it("returns 100% for a fully filled company A profile + 1 complete vessel", () => {
    const fleet: FleetVessel[] = [
      {
        name: "Le Test",
        yearBuilt: 2020,
        length: 30,
        passengerCapacity: 100,
        fuelType: "GO",
        consumptionPerTrip: "100",
        crewByBrevet: { matelot: 2, capitaine_500_3000: 1 },
      },
    ];
    const r = computeProfileCompleteness({
      user: {
        company: "Test Co",
        companyDescription: "Description",
        companyLogo: "logo.png",
        companyEmail: "a@b.fr",
        companyPhone: "01",
        companyAddress: "Brest",
        companyLinkedinUrl: "https://linkedin.com/co",
      },
      member: baseMember,
      fleet,
      college: "A",
      org: { employeeCount: 10, revenue: 1000000 },
    });
    expect(r.total).toBe(100);
    expect(r.isComplete).toBe(true);
    expect(r.missingPct).toBe(0);
  });

  it("for collège C, only profile + financials count (2 sections)", () => {
    const r = computeProfileCompleteness({ user: {}, fleet: [], college: "C" });
    expect(r.sections).toHaveLength(2);
    expect(r.sections.map((s) => s.key)).toEqual(["profile", "financials"]);
  });

  it("collège C with full profile + financials reaches 100% even with no fleet", () => {
    const r = computeProfileCompleteness({
      user: {
        company: "Expert Co",
        companyDescription: "Description",
        companyLogo: "logo.png",
        companyEmail: "a@b.fr",
        companyPhone: "01",
        companyAddress: "Paris",
        companyLinkedinUrl: "https://linkedin.com/co",
      },
      fleet: [],
      college: "C",
      org: { employeeCount: 5, revenue: 500000 },
    });
    expect(r.total).toBe(100);
    expect(r.isComplete).toBe(true);
  });

  it("partial completion : missingPct + total = 100", () => {
    const r = computeProfileCompleteness({
      user: { companyLogo: "logo.png", companyDescription: "x", companyEmail: "a@b.fr" },
      member: baseMember,
      fleet: [],
      college: "A",
    });
    expect(r.total + r.missingPct).toBe(100);
    expect(r.isComplete).toBe(false);
  });
});
