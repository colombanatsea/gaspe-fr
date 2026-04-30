import { describe, it, expect } from "vitest";
import {
  isItemValidatedForYear,
  countValidatedItems,
  deriveCampaignUrgency,
  resolveTargetYear,
  buildProfileSnapshot,
  buildVesselSnapshot,
  parseValidationItems,
  summarizeOrgForDashboard,
  ValidationInputError,
} from "../validation-helpers";

describe("isItemValidatedForYear", () => {
  it("returns false when last_validated_year is null", () => {
    expect(isItemValidatedForYear({ last_validated_year: null }, 2027)).toBe(
      false,
    );
  });

  it("returns false when last < target", () => {
    expect(isItemValidatedForYear({ last_validated_year: 2026 }, 2027)).toBe(
      false,
    );
  });

  it("returns true when last equals target", () => {
    expect(isItemValidatedForYear({ last_validated_year: 2027 }, 2027)).toBe(
      true,
    );
  });

  it("returns true when last is greater than target (validation anticipee)", () => {
    expect(isItemValidatedForYear({ last_validated_year: 2028 }, 2027)).toBe(
      true,
    );
  });
});

describe("countValidatedItems", () => {
  it("returns zeros for empty list", () => {
    expect(countValidatedItems([], 2027)).toEqual({
      validated: 0,
      total: 0,
      percentage: 0,
    });
  });

  it("counts all validated when every item passes", () => {
    const items = [
      { last_validated_year: 2027 },
      { last_validated_year: 2028 },
      { last_validated_year: 2027 },
    ];
    expect(countValidatedItems(items, 2027)).toEqual({
      validated: 3,
      total: 3,
      percentage: 100,
    });
  });

  it("counts none when all items lag behind", () => {
    const items = [
      { last_validated_year: 2025 },
      { last_validated_year: null },
    ];
    expect(countValidatedItems(items, 2027)).toEqual({
      validated: 0,
      total: 2,
      percentage: 0,
    });
  });

  it("rounds percentage to nearest integer", () => {
    const items = [
      { last_validated_year: 2027 },
      { last_validated_year: 2025 },
      { last_validated_year: 2025 },
    ];
    // 1/3 = 33.33 → 33
    expect(countValidatedItems(items, 2027).percentage).toBe(33);
  });
});

describe("deriveCampaignUrgency", () => {
  const oneDayMs = 86_400_000;
  const target = "2027-03-31T23:59:59Z";
  const targetMs = new Date(target).getTime();

  it("returns 'draft' when status is draft regardless of dates", () => {
    expect(
      deriveCampaignUrgency({ status: "draft", target_date: target }, targetMs),
    ).toBe("draft");
  });

  it("returns 'closed' when status is closed regardless of dates", () => {
    expect(
      deriveCampaignUrgency(
        { status: "closed", target_date: target },
        targetMs - 100 * oneDayMs,
      ),
    ).toBe("closed");
  });

  it("returns 'open' when no target_date", () => {
    expect(
      deriveCampaignUrgency({ status: "open", target_date: null }, Date.now()),
    ).toBe("open");
  });

  it("returns 'open' when target_date is malformed", () => {
    expect(
      deriveCampaignUrgency(
        { status: "open", target_date: "pas-une-date" },
        Date.now(),
      ),
    ).toBe("open");
  });

  it("returns 'open' when now is before due-soon threshold (>14 days before target)", () => {
    expect(
      deriveCampaignUrgency(
        { status: "open", target_date: target },
        targetMs - 30 * oneDayMs,
      ),
    ).toBe("open");
  });

  it("returns 'due-soon' when now is exactly at threshold (14 days before)", () => {
    expect(
      deriveCampaignUrgency(
        { status: "open", target_date: target },
        targetMs - 14 * oneDayMs,
      ),
    ).toBe("due-soon");
  });

  it("returns 'due-soon' when now is inside threshold but before target", () => {
    expect(
      deriveCampaignUrgency(
        { status: "open", target_date: target },
        targetMs - 5 * oneDayMs,
      ),
    ).toBe("due-soon");
  });

  it("returns 'overdue' when now is past target", () => {
    expect(
      deriveCampaignUrgency(
        { status: "open", target_date: target },
        targetMs + oneDayMs,
      ),
    ).toBe("overdue");
  });

  it("respects custom dueSoonDays parameter", () => {
    expect(
      deriveCampaignUrgency(
        { status: "open", target_date: target },
        targetMs - 20 * oneDayMs,
        30, // due-soon = 30 days
      ),
    ).toBe("due-soon");
  });
});

describe("resolveTargetYear", () => {
  it("uses campaign target_year when an open campaign exists", () => {
    expect(
      resolveTargetYear({ target_year: 2027 }, new Date("2026-12-15")),
    ).toBe(2027);
  });

  it("falls back to current year when no campaign", () => {
    expect(resolveTargetYear(null, new Date("2027-04-15T00:00:00Z"))).toBe(
      2027,
    );
  });

  it("uses UTC year (not local) to avoid timezone drift on Dec 31", () => {
    // Date.UTC(2027,11,31,23,0,0) → 2027-12-31T23:00:00Z, UTC year = 2027
    expect(
      resolveTargetYear(null, new Date("2027-12-31T23:00:00Z")),
    ).toBe(2027);
  });
});

describe("buildProfileSnapshot", () => {
  it("normalizes undefined and null fields to null", () => {
    expect(buildProfileSnapshot({})).toEqual({
      email: null,
      phone: null,
      address: null,
      websiteUrl: null,
      logoUrl: null,
      description: null,
      employeeCount: null,
      shipCount: null,
    });
  });

  it("maps snake_case D1 columns to camelCase output", () => {
    const snap = buildProfileSnapshot({
      email: "info@karu.fr",
      phone: "0590...",
      address: "Pointe-a-Pitre",
      website_url: "https://karu.fr",
      logo_url: "/logos/karu.png",
      description: "Liaisons inter-iles",
      employee_count: 42,
      ship_count: 5,
    });
    expect(snap).toEqual({
      email: "info@karu.fr",
      phone: "0590...",
      address: "Pointe-a-Pitre",
      websiteUrl: "https://karu.fr",
      logoUrl: "/logos/karu.png",
      description: "Liaisons inter-iles",
      employeeCount: 42,
      shipCount: 5,
    });
  });
});

describe("buildVesselSnapshot", () => {
  const minimal = { id: "v-1", name: "Karu Express" };

  it("produces a snapshot from minimal input", () => {
    expect(buildVesselSnapshot(minimal)).toEqual({
      id: "v-1",
      name: "Karu Express",
      imo: null,
      type: null,
      flag: null,
      yearBuilt: null,
      passengerCapacity: null,
      vehicleCapacity: null,
      freightCapacity: null,
      grossTonnage: null,
      crewByBrevet: null,
    });
  });

  it("parses crew_by_brevet JSON and filters invalid entries", () => {
    const snap = buildVesselSnapshot({
      ...minimal,
      crew_by_brevet: JSON.stringify({
        captain_500: 1,
        chief_engineer: 0, // filtered
        steward: -2, // filtered
        cook: "3", // coerced
        bogus: "abc", // filtered
      }),
    });
    expect(snap.crewByBrevet).toEqual({ captain_500: 1, cook: 3 });
  });

  it("returns null crewByBrevet on malformed JSON", () => {
    expect(
      buildVesselSnapshot({ ...minimal, crew_by_brevet: "{not json" })
        .crewByBrevet,
    ).toBeNull();
  });

  it("returns null crewByBrevet when JSON is an array (not object)", () => {
    expect(
      buildVesselSnapshot({ ...minimal, crew_by_brevet: "[1,2,3]" })
        .crewByBrevet,
    ).toBeNull();
  });

  it("returns null crewByBrevet when all entries are filtered out", () => {
    expect(
      buildVesselSnapshot({
        ...minimal,
        crew_by_brevet: JSON.stringify({ a: 0, b: -1, c: "nope" }),
      }).crewByBrevet,
    ).toBeNull();
  });

  it("floors numeric crew counts", () => {
    expect(
      buildVesselSnapshot({
        ...minimal,
        crew_by_brevet: JSON.stringify({ deckhand: 2.7 }),
      }).crewByBrevet,
    ).toEqual({ deckhand: 2 });
  });
});

describe("parseValidationItems", () => {
  it("rejects non-array input", () => {
    expect(() => parseValidationItems({ foo: "bar" })).toThrow(
      ValidationInputError,
    );
    expect(() => parseValidationItems("string")).toThrow(ValidationInputError);
    expect(() => parseValidationItems(null)).toThrow(ValidationInputError);
  });

  it("rejects empty array", () => {
    expect(() => parseValidationItems([])).toThrow(/Au moins un item/);
  });

  it("rejects more than 200 items", () => {
    const big = Array.from({ length: 201 }, (_, i) => ({
      type: "vessel",
      id: `v-${i}`,
      unchanged: true,
    }));
    expect(() => parseValidationItems(big)).toThrow(/Trop d'items/);
  });

  it("accepts a valid profile-only payload", () => {
    expect(
      parseValidationItems([{ type: "profile", unchanged: true }]),
    ).toEqual([{ type: "profile", unchanged: true, id: undefined, data: undefined }]);
  });

  it("accepts a valid vessel-only payload with data", () => {
    const items = parseValidationItems([
      {
        type: "vessel",
        id: "v-42",
        unchanged: false,
        data: { passengerCapacity: 280 },
      },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("v-42");
    expect(items[0].unchanged).toBe(false);
    expect(items[0].data).toEqual({ passengerCapacity: 280 });
  });

  it("accepts mixed profile + multiple vessels", () => {
    expect(
      parseValidationItems([
        { type: "profile", unchanged: true },
        { type: "vessel", id: "v-1", unchanged: true },
        { type: "vessel", id: "v-2", unchanged: false, data: { type: "Ferry" } },
      ]),
    ).toHaveLength(3);
  });

  it("rejects invalid type", () => {
    expect(() =>
      parseValidationItems([{ type: "user", unchanged: true }]),
    ).toThrow(/type doit etre/);
  });

  it("rejects vessel without id", () => {
    expect(() =>
      parseValidationItems([{ type: "vessel", unchanged: true }]),
    ).toThrow(/id \(vessel\) requis/);
  });

  it("rejects vessel with empty id", () => {
    expect(() =>
      parseValidationItems([{ type: "vessel", id: "  ", unchanged: true }]),
    ).toThrow(/id \(vessel\) requis/);
  });

  it("rejects duplicate vessel ids", () => {
    expect(() =>
      parseValidationItems([
        { type: "vessel", id: "v-1", unchanged: true },
        { type: "vessel", id: "v-1", unchanged: true },
      ]),
    ).toThrow(/en double/);
  });

  it("rejects two profile entries", () => {
    expect(() =>
      parseValidationItems([
        { type: "profile", unchanged: true },
        { type: "profile", unchanged: true },
      ]),
    ).toThrow(/profile en double/);
  });

  it("rejects non-object items", () => {
    expect(() => parseValidationItems(["string"])).toThrow(/objet attendu/);
    expect(() => parseValidationItems([null])).toThrow(/objet attendu/);
  });

  it("defaults unchanged to false when not strictly true", () => {
    const items = parseValidationItems([
      { type: "profile", unchanged: "yes" },
    ]);
    expect(items[0].unchanged).toBe(false);
  });

  it("ignores data field that is not an object", () => {
    const items = parseValidationItems([
      { type: "profile", unchanged: false, data: "not an object" },
    ]);
    expect(items[0].data).toBeUndefined();
  });
});

describe("summarizeOrgForDashboard", () => {
  const baseRow = {
    organizationId: "org-1",
    organizationName: "Karu'Ferry",
    slug: "karu-ferry",
    titulaireEmail: "info@karu.fr",
  };

  it("marks fully validated when profile + all vessels are validated", () => {
    expect(
      summarizeOrgForDashboard(
        {
          ...baseRow,
          profileLastValidatedYear: 2027,
          vessels: [
            { last_validated_year: 2027 },
            { last_validated_year: 2028 },
          ],
        },
        2027,
      ),
    ).toMatchObject({
      profileValidated: true,
      vesselsValidated: 2,
      vesselsTotal: 2,
      fullyValidated: true,
    });
  });

  it("is fully validated when profile validated and no vessels exist", () => {
    expect(
      summarizeOrgForDashboard(
        { ...baseRow, profileLastValidatedYear: 2027, vessels: [] },
        2027,
      ).fullyValidated,
    ).toBe(true);
  });

  it("is not fully validated when profile is missing", () => {
    expect(
      summarizeOrgForDashboard(
        {
          ...baseRow,
          profileLastValidatedYear: null,
          vessels: [{ last_validated_year: 2027 }],
        },
        2027,
      ).fullyValidated,
    ).toBe(false);
  });

  it("counts partial vessel validation", () => {
    const summary = summarizeOrgForDashboard(
      {
        ...baseRow,
        profileLastValidatedYear: 2027,
        vessels: [
          { last_validated_year: 2027 },
          { last_validated_year: 2025 },
          { last_validated_year: null },
        ],
      },
      2027,
    );
    expect(summary.vesselsValidated).toBe(1);
    expect(summary.vesselsTotal).toBe(3);
    expect(summary.fullyValidated).toBe(false);
  });

  it("preserves identity fields in the summary", () => {
    const summary = summarizeOrgForDashboard(
      { ...baseRow, profileLastValidatedYear: 2027, vessels: [] },
      2027,
    );
    expect(summary.organizationId).toBe("org-1");
    expect(summary.slug).toBe("karu-ferry");
    expect(summary.titulaireEmail).toBe("info@karu.fr");
  });
});
