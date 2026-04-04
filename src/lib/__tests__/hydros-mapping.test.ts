import { describe, it, expect } from "vitest";
import {
  HYDROS_CONTRACT_TYPE,
  HYDROS_POSITION,
  HYDROS_BEGIN,
  HYDROS_FIXED,
  buildHydrosPayload,
} from "../hydros-mapping";

describe("hydros-mapping", () => {
  it("maps all GASPE contract types to Hydros IDs", () => {
    expect(HYDROS_CONTRACT_TYPE["CDI"]).toBe("3000295");
    expect(HYDROS_CONTRACT_TYPE["CDD"]).toBe("3000296");
    expect(HYDROS_CONTRACT_TYPE["Stage"]).toBe("3000297");
    expect(HYDROS_CONTRACT_TYPE["Alternance"]).toBe("3000297");
    expect(HYDROS_CONTRACT_TYPE["Saisonnier"]).toBe("3000296");
    expect(HYDROS_CONTRACT_TYPE["Autres"]).toBe("3000299");
  });

  it("maps all GASPE categories to Hydros position IDs", () => {
    expect(HYDROS_POSITION["Pont"]).toBe("3000209");
    expect(HYDROS_POSITION["Machine"]).toBe("3000210");
    expect(HYDROS_POSITION["Technique"]).toBe("3000214");
    expect(HYDROS_POSITION["Direction"]).toBe("3000197");
    expect(HYDROS_POSITION["Autre"]).toBe("3000299");
  });

  it("maps all months to Hydros begin IDs", () => {
    expect(HYDROS_BEGIN["Immédiat"]).toBe("3000409");
    expect(HYDROS_BEGIN["Janvier"]).toBe("3000411");
    expect(HYDROS_BEGIN["Décembre"]).toBe("3000422");
    expect(Object.keys(HYDROS_BEGIN).length).toBe(14);
  });

  it("has correct fixed values", () => {
    expect(HYDROS_FIXED.SECTOR_TRANSPORTS).toBe("3000381");
    expect(HYDROS_FIXED.REMOTE_ON_SITE).toBe("3000432");
  });

  it("builds a valid payload from a job", () => {
    const payload = buildHydrosPayload({
      title: "Capitaine 3000 UMS",
      description: "<p>Description du poste</p>",
      profile: "<p>Profil recherché</p>",
      conditions: "<p>Conditions</p>",
      company: "Manche Iles Express",
      location: "Granville",
      contractType: "CDI",
      category: "Pont",
      startDate: "Septembre",
      contactEmail: "rh@mie.fr",
      contactFirstName: "Jean",
      contactLastName: "Dupont",
    });

    expect(payload.title).toBe("Capitaine 3000 UMS");
    expect(payload.contractTypeId).toBe("3000295");
    expect(payload.positionId).toBe("3000209");
    expect(payload.beginId).toBe("3000419");
    expect(payload.sectorId).toBe("3000381");
    expect(payload.remoteId).toBe("3000432");
    expect(payload.contactFirstName).toBe("Jean");
    expect(payload.contactLastName).toBe("Dupont");
    expect(payload.companyDescription).toContain("Manche Iles Express");
  });

  it("uses fallback values for unknown mappings", () => {
    const payload = buildHydrosPayload({
      title: "Poste",
      description: "Desc",
      profile: "",
      conditions: "",
      company: "Test",
      location: "Test",
      contractType: "UnknownType",
      category: "UnknownCategory",
      contactEmail: "test@test.fr",
    });

    expect(payload.contractTypeId).toBe("3000299"); // Autres fallback
    expect(payload.positionId).toBe("3000299"); // Autre fallback
    expect(payload.beginId).toBe("3000409"); // Immédiat default
  });
});
