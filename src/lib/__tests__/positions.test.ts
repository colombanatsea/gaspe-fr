import { describe, it, expect } from "vitest";
import {
  positions,
  publishedPositions,
  getPositionBySlug,
  type PositionItem,
} from "@/data/positions";

/* -------------------------------------------------------------------- */
/*  Structural / editorial invariants                                    */
/* -------------------------------------------------------------------- */

describe("data/positions", () => {
  // Le tableau peut être vide (pas de contenu éditorial publié) ; dans ce cas
  // les tests suivants sur les invariants structurels sont des no-op.
  it("is a valid array", () => {
    expect(Array.isArray(positions)).toBe(true);
  });

  it("guarantees unique slugs", () => {
    const slugs = positions.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has only kebab-case lowercase slugs", () => {
    const re = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const p of positions) {
      expect(re.test(p.slug), `invalid slug: ${p.slug}`).toBe(true);
    }
  });

  it("has consistent sortKey format (YYYY-MM or YYYY-MM-DD)", () => {
    const re = /^\d{4}-\d{2}(?:-\d{2})?$/;
    for (const p of positions) {
      expect(re.test(p.sortKey), `invalid sortKey: ${p.sortKey}`).toBe(true);
    }
  });

  it("has valid ISO publishedAt (parseable)", () => {
    for (const p of positions) {
      const ts = Date.parse(p.publishedAt);
      expect(Number.isNaN(ts), `invalid publishedAt: ${p.publishedAt}`).toBe(false);
    }
  });

  it("has a non-empty body on every position", () => {
    for (const p of positions) {
      expect(p.body.trim().length, `empty body on ${p.slug}`).toBeGreaterThan(100);
    }
  });

  it("has a non-empty excerpt < 250 chars on every position", () => {
    for (const p of positions) {
      expect(p.excerpt.trim().length).toBeGreaterThan(20);
      expect(p.excerpt.length).toBeLessThanOrEqual(250);
    }
  });

  it("uses only allowed tags", () => {
    const allowed = new Set(["Position", "Actualité", "Presse"]);
    for (const p of positions) {
      expect(allowed.has(p.tag), `invalid tag on ${p.slug}: ${p.tag}`).toBe(true);
    }
  });
});

/* -------------------------------------------------------------------- */
/*  Typography rule : em-dash `–` (U+2014) is forbidden in public text   */
/* -------------------------------------------------------------------- */

describe("data/positions – typography", () => {
  it("does not contain any em-dash in title / excerpt / body", () => {
    for (const p of positions) {
      const haystacks: Array<[string, string]> = [
        ["title", p.title],
        ["excerpt", p.excerpt],
        ["body", p.body],
      ];
      for (const [field, text] of haystacks) {
        expect(
          text.includes("\u2014"),
          `em-dash found in ${p.slug}.${field}`,
        ).toBe(false);
      }
    }
  });
});

/* -------------------------------------------------------------------- */
/*  Sort / lookup helpers                                                */
/* -------------------------------------------------------------------- */

describe("data/positions – helpers", () => {
  it("publishedPositions is sorted descending by sortKey", () => {
    const keys = publishedPositions.map((p: PositionItem) => p.sortKey);
    const sorted = [...keys].sort((a, b) => b.localeCompare(a));
    expect(keys).toEqual(sorted);
  });

  it("getPositionBySlug returns the matching position", () => {
    // Skip when no positions are published (empty editorial backlog).
    if (positions.length === 0) return;
    const first = positions[0];
    expect(getPositionBySlug(first.slug)?.title).toBe(first.title);
  });

  it("getPositionBySlug returns undefined for unknown slug", () => {
    expect(getPositionBySlug("does-not-exist")).toBeUndefined();
  });
});
