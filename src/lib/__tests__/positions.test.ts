import { describe, it, expect } from "vitest";
import { POSITIONS, POSITIONS_SORTED, getPositionBySlug } from "@/data/positions";

describe("positions data", () => {
  it("a au moins une position publiée", () => {
    expect(POSITIONS.length).toBeGreaterThan(0);
  });

  it("slugs uniques", () => {
    const slugs = POSITIONS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("slugs kebab-case sans espaces ni majuscules", () => {
    for (const p of POSITIONS) {
      expect(p.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("chaque position a un sortKey YYYY-MM cohérent avec publishedAt", () => {
    for (const p of POSITIONS) {
      expect(p.sortKey).toMatch(/^\d{4}-\d{2}$/);
      expect(p.publishedAt.slice(0, 7)).toBe(p.sortKey);
    }
  });

  it("publishedAt est une date ISO valide", () => {
    for (const p of POSITIONS) {
      const d = new Date(p.publishedAt);
      expect(Number.isNaN(d.getTime())).toBe(false);
    }
  });

  it("excerpt non vide et raisonnablement court (<= 250 car)", () => {
    for (const p of POSITIONS) {
      expect(p.excerpt.length).toBeGreaterThan(0);
      expect(p.excerpt.length).toBeLessThanOrEqual(250);
    }
  });

  it("body HTML non vide et contient au moins un paragraphe", () => {
    for (const p of POSITIONS) {
      expect(p.body.trim().length).toBeGreaterThan(20);
      expect(p.body).toContain("<p>");
    }
  });

  it("tag est l'une des 3 valeurs autorisées", () => {
    for (const p of POSITIONS) {
      expect(["Position", "Actualité", "Presse"]).toContain(p.tag);
    }
  });

  it("body ne contient pas de tiret quadratique — (interdit charte)", () => {
    for (const p of POSITIONS) {
      expect(p.body).not.toContain("—");
      expect(p.excerpt).not.toContain("—");
    }
  });

  describe("POSITIONS_SORTED", () => {
    it("trie par sortKey décroissant (plus récent d'abord)", () => {
      for (let i = 1; i < POSITIONS_SORTED.length; i++) {
        expect(POSITIONS_SORTED[i - 1].sortKey >= POSITIONS_SORTED[i].sortKey).toBe(true);
      }
    });

    it("contient tous les éléments de POSITIONS", () => {
      expect(POSITIONS_SORTED.length).toBe(POSITIONS.length);
    });
  });

  describe("getPositionBySlug", () => {
    it("retourne la bonne position pour un slug existant", () => {
      const p = POSITIONS[0];
      expect(getPositionBySlug(p.slug)).toEqual(p);
    });

    it("retourne undefined pour un slug inconnu", () => {
      expect(getPositionBySlug("slug-qui-n-existe-pas")).toBeUndefined();
    });
  });
});
