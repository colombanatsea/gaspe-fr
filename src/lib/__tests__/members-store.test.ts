import { describe, it, expect, vi } from "vitest";
import { getStoredMembers, getActiveMembers, saveMembers, MEMBERS_KEY } from "../members-store";

// Mock the static members data
vi.mock("@/data/members", () => ({
  members: [
    {
      id: "1",
      name: "Compagnie A",
      slug: "compagnie-a",
      shortName: "Cie A",
      description: "Test",
      region: "Normandie",
      type: "maritime",
      routes: [],
      fleet: [],
      lat: 48.8,
      lng: -1.6,
    },
    {
      id: "2",
      name: "Compagnie B",
      slug: "compagnie-b",
      shortName: "Cie B",
      description: "Test",
      region: "Bretagne",
      type: "maritime",
      routes: [],
      fleet: [],
      lat: 48.1,
      lng: -3.0,
    },
  ],
}));

describe("members-store", () => {
  it("seeds from static data on first call", () => {
    const members = getStoredMembers();
    expect(members).toHaveLength(2);
    expect(members[0].name).toBe("Compagnie A");
    expect(members[0].archived).toBe(false);
    // Should have been written to localStorage
    expect(localStorage.getItem(MEMBERS_KEY)).not.toBeNull();
  });

  it("returns cached data on subsequent calls", () => {
    getStoredMembers(); // seeds
    const members = getStoredMembers(); // reads from LS
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
});
