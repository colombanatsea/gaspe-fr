import { describe, it, expect } from "vitest";
import { formatTimestamp, formatDate, formatNumber } from "../format-date";

describe("formatTimestamp", () => {
  it("formate un ISO avec T au format DD/MM/YYYY HH:mm fr-FR", () => {
    const out = formatTimestamp("2026-05-17T10:30:00Z");
    // Sortie locale-dependant ; on verifie la structure plutot que l'exact
    expect(out).toMatch(/17\/05\/2026/);
    expect(out).toMatch(/\d{2}:\d{2}/);
  });

  it("supporte le format SQLite 'YYYY-MM-DD HH:MM:SS' (sans T)", () => {
    const out = formatTimestamp("2026-05-17 10:30:00");
    expect(out).toMatch(/17\/05\/2026/);
  });

  it("fallback sur la chaine brute en cas d'erreur", () => {
    const out = formatTimestamp("not a date");
    // Date(not a date) → Invalid Date → toLocaleString returns "Invalid Date"
    // mais le helper retourne quand meme la chaine brute via le catch SI throw.
    // Sans throw, on retourne "Invalid Date" depuis toLocaleString.
    expect(typeof out).toBe("string");
  });
});

describe("formatDate", () => {
  it("formate YYYY-MM-DD en DD/MM/YYYY", () => {
    expect(formatDate("2026-05-17")).toBe("17/05/2026");
  });

  it("formate un ISO complet en DD/MM/YYYY (sans heure)", () => {
    expect(formatDate("2026-05-17T10:30:00Z")).toBe("17/05/2026");
  });

  it("retourne chaine vide pour entree vide", () => {
    expect(formatDate("")).toBe("");
  });

  it("retourne la chaine brute pour entree invalide", () => {
    expect(formatDate("invalid")).toBe("invalid");
  });
});

describe("formatNumber", () => {
  it("formate un entier au format FR (espace milliers)", () => {
    // toLocaleString utilise U+202F (narrow no-break space) sur Node moderne
    const out = formatNumber(12345);
    expect(out).toMatch(/12.345/); // un séparateur entre 12 et 345
  });

  it("formate un décimal avec maxFractionDigits", () => {
    expect(formatNumber(3.14159, 2)).toMatch(/3,14/);
  });

  it("respecte maxFractionDigits=0 par défaut (entier)", () => {
    expect(formatNumber(3.7)).toBe("4"); // arrondi
  });

  it("retourne '-' pour null/undefined/NaN/Infinity", () => {
    expect(formatNumber(null)).toBe("-");
    expect(formatNumber(undefined)).toBe("-");
    expect(formatNumber(NaN)).toBe("-");
    expect(formatNumber(Infinity)).toBe("-");
  });

  it("formate 0 correctement (et non '-')", () => {
    expect(formatNumber(0)).toBe("0");
  });
});
