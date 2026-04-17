import { describe, it, expect } from "vitest";
import {
  parseSeaServiceText,
  parseCertificatesText,
  parseMedicalText,
  extractMarinId,
  parseEnmText,
} from "../enm-parser";

describe("extractMarinId", () => {
  it("extracts from 'N° marin' format", () => {
    expect(extractMarinId("N° marin 12345678")).toBe("12345678");
  });
  it("extracts from 'marin n°' format", () => {
    expect(extractMarinId("marin n° 12345678")).toBe("12345678");
  });
  it("extracts from 'N°' format", () => {
    expect(extractMarinId("Identifiant : N° 12345678")).toBe("12345678");
  });
  it("extracts standalone 8-digit number", () => {
    expect(extractMarinId("Mon identifiant est 12345678 sur le portail")).toBe("12345678");
  });
  it("returns undefined for no match", () => {
    expect(extractMarinId("pas de numéro ici")).toBeUndefined();
  });
});

describe("parseSeaServiceText", () => {
  it("parses basic service entry", () => {
    const text = `
Service en mer
01/01/2023 - 30/06/2023
BELLE ILE - 1234567
CAPITAINE
Cat.: 3
    `;
    const result = parseSeaServiceText(text);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].startDate).toBe("2023-01-01");
    expect(result[0].endDate).toBe("2023-06-30");
    expect(result[0].vesselName).toContain("BELLE ILE");
    expect(result[0].vesselImo).toBe("1234567");
    expect(result[0].rank).toBe("CAPITAINE");
    expect(result[0].category).toBe("3");
  });

  it("parses vessel with parenthesized IMO", () => {
    const text = `
01/03/2024 - 15/09/2024
BREST EXPRESS (9876543)
MATELOT
Catégorie 4
    `;
    const result = parseSeaServiceText(text);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].vesselImo).toBe("9876543");
  });

  it("parses en-dash date separators", () => {
    const text = `
15/06/2023 – 31/12/2023
PORT NAVALO – 1234567
LIEUTENANT
Cat.: 2
    `;
    const result = parseSeaServiceText(text);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].startDate).toBe("2023-06-15");
  });

  it("returns empty for text with no dates", () => {
    const result = parseSeaServiceText("Pas de service en mer enregistré.");
    expect(result).toHaveLength(0);
  });

  it("handles multiple service entries", () => {
    const text = `
01/01/2022 - 30/06/2022
NAVIRE A - 1111111
MATELOT
Cat.: 3

01/07/2022 - 31/12/2022
NAVIRE B - 2222222
CAPITAINE
Cat.: 4
    `;
    const result = parseSeaServiceText(text);
    expect(result.length).toBe(2);
  });
});

describe("parseCertificatesText", () => {
  it("parses certificate with n° reference", () => {
    const text = `
Brevet de capitaine 200
n°1234567
Valide
31/12/2025
    `;
    const result = parseCertificatesText(text);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].enmReference).toBe("1234567");
    expect(result[0].status).toBe("valid");
    expect(result[0].expiryDate).toBe("2025-12-31");
  });

  it("detects expired certificates", () => {
    const text = `
Certificat STCW
n°9999999
Expiré
31/12/2023
    `;
    const result = parseCertificatesText(text);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].status).toBe("expired");
  });

  it("uses fallback parsing for brevet-style text", () => {
    const text = `
Brevet de patron de navigation côtière 1234567 31/12/2026
Certificat de formation de base STCW 7654321 Expiré 01/01/2024
    `;
    const result = parseCertificatesText(text);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for no certificates", () => {
    const result = parseCertificatesText("Aucun titre enregistré.");
    expect(result).toHaveLength(0);
  });
});

describe("parseMedicalText", () => {
  it("parses complete medical record", () => {
    const text = `
Type de visite : Annuelle
Date de dernière visite : 15/03/2024
Date de fin de validité : 15/03/2025
Décision médicale : Apte TF/TN
Durée de l'aptitude : 12 mois
    `;
    const result = parseMedicalText(text);
    expect(result.visitType).toBe("Annuelle");
    expect(result.lastVisitDate).toBe("2024-03-15");
    expect(result.expiryDate).toBe("2025-03-15");
    expect(result.decision).toBe("Apte TF/TN");
    expect(result.duration).toBe("12 mois");
  });

  it("parses restrictions", () => {
    const text = `
Décision : Apte TF avec restriction
Restrictions :
Port de verres correcteurs
    `;
    const result = parseMedicalText(text);
    expect(result.restrictions.length).toBeGreaterThanOrEqual(1);
    expect(result.restrictions).toContain("Port de verres correcteurs");
  });

  it("detects visit type from keyword", () => {
    const result = parseMedicalText("Visite Initiale le 01/01/2024");
    expect(result.visitType).toBe("Initiale");
  });

  it("extracts dates from minimal text", () => {
    const text = "Visite du 01/06/2024, validité 01/06/2025";
    const result = parseMedicalText(text);
    expect(result.lastVisitDate).toBe("2024-06-01");
    expect(result.expiryDate).toBe("2025-06-01");
  });

  it("returns empty restrictions when none present", () => {
    const result = parseMedicalText("Apte sans restriction");
    expect(result.restrictions).toHaveLength(0);
  });
});

describe("parseEnmText", () => {
  it("parses combined ENM paste", () => {
    const text = `
N° marin 12345678

Lignes de service
01/01/2024 - 30/06/2024
BELLE FRANCE - 9876543
CAPITAINE
Cat.: 3

Mes titres
Brevet de capitaine 200
n°1111111
Valide
31/12/2026

Aptitude médicale
Type de visite : Annuelle
Date de dernière visite : 01/02/2024
Date de fin de validité : 01/02/2025
Décision médicale : Apte TF/TN
    `;
    const result = parseEnmText(text);
    expect(result.enmMarinId).toBe("12345678");
    expect(result.seaService.length).toBeGreaterThanOrEqual(1);
    expect(result.certificates.length).toBeGreaterThanOrEqual(1);
    expect(result.medical.visitType).toBe("Annuelle");
  });
});
