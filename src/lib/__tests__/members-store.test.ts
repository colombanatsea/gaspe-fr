import { describe, it, expect, vi } from "vitest";
import { getStoredMembers, getActiveMembers, saveMembers, MEMBERS_KEY } from "../members-store";

// Mock the static members data — must match Member schema (types/index.ts)
vi.mock("@/data/members", () => ({
  members: [
    {
      name: "Compagnie A",
      slug: "compagnie-a",
      city: "Granville",
      latitude: 48.8,
      longitude: -1.6,
      region: "Normandie",
      territory: "metropole",
      category: "titulaire",
      description: "Test A",
    },
    {
      name: "Compagnie B",
      slug: "compagnie-b",
      city: "Brest",
      latitude: 48.1,
      longitude: -3.0,
      region: "Bretagne",
      territory: "metropole",
      category: "associe",
      description: "Test B",
    },
  ],
}));

describe("members-store", () => {
  it("seeds from static data on first call", () => {
    const members = getStoredMembers();
    expect(members).toHaveLength(2);
    expect(members[0].name).toBe("Compagnie A");
    expect(members[0].archived).toBe(false);
    expect(localStorage.getItem(MEMBERS_KEY)).not.toBeNull();
  });

  it("returns cached data on subsequent calls", () => {
    getStoredMembers(); // seeds
    const members = getStoredMembers(); // reads from LS with Zod validation
    expect(members).toHaveLength(2);
  });

  it("saves members to localStorage", () => {
    const members = getStoredMembers();
    members[0].archived = true;
    saveMembers(members);

    const raw = localStorage.getItem(MEMBERS_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed[0].archived).toBe(true);
  });

  it("getActiveMembers filters out archived", () => {
    const members = getStoredMembers();
    members[1].archived = true;
    saveMembers(members);

    const active = getActiveMembers();
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe("Compagnie A");
  });

  it("falls back to static data on corrupted localStorage", () => {
    localStorage.setItem(MEMBERS_KEY, "not valid json {{{");
    const members = getStoredMembers();
    expect(members).toHaveLength(2);
    expect(members[0].name).toBe("Compagnie A");
  });
});
