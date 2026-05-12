import { describe, it, expect } from "vitest";
import {
  normalize,
  tokenize,
  scoreDocument,
  rankDocuments,
  type ScorableDoc,
} from "../search-scoring";

/**
 * Tests du moteur de scoring fulltext (G1 du feedback post-launch —
 * /recherche?q=...). La logique a été extraite de recherche/page.tsx
 * vers un module pur pour permettre les tests unitaires.
 */

describe("normalize", () => {
  it("passe en minuscules", () => {
    expect(normalize("BONJOUR")).toBe("bonjour");
  });

  it("retire les accents (NFD + diacritiques)", () => {
    expect(normalize("Îles du Ponant")).toBe("iles du ponant");
    expect(normalize("éàêçùë")).toBe("eaecue");
  });

  it("conserve la ponctuation et les espaces", () => {
    expect(normalize("Hello, World!")).toBe("hello, world!");
  });

  it("gère une chaîne vide", () => {
    expect(normalize("")).toBe("");
  });
});

describe("tokenize", () => {
  it("découpe sur espaces, virgules, points-virgules", () => {
    expect(tokenize("a b c")).toEqual(["a", "b", "c"].filter((t) => t.length >= 2));
    expect(tokenize("tourisme, navigation")).toEqual(["tourisme", "navigation"]);
    expect(tokenize("a;b;c")).toEqual([]);
  });

  it("ignore les tokens < 2 caractères", () => {
    expect(tokenize("a la mer")).toEqual(["la", "mer"]);
  });

  it("normalise (lowercase + sans accents) avant tokenisation", () => {
    expect(tokenize("Îles du Ponant")).toEqual(["iles", "du", "ponant"]);
  });

  it("gère une requête vide ou avec uniquement des séparateurs", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
    expect(tokenize(",;, ")).toEqual([]);
  });
});

function makeDoc(o: Partial<ScorableDoc> = {}): ScorableDoc {
  return {
    title: "Position GASPE",
    excerpt: null,
    content: null,
    tags: null,
    ...o,
  };
}

describe("scoreDocument", () => {
  it("retourne 0 si aucun terme", () => {
    expect(scoreDocument(makeDoc(), [])).toBe(0);
  });

  it("retourne 0 si aucun match", () => {
    expect(scoreDocument(makeDoc({ title: "GASPE" }), ["xyz"])).toBe(0);
  });

  it("match titre = +5", () => {
    expect(scoreDocument(makeDoc({ title: "tourisme" }), ["tourisme"])).toBe(5);
  });

  it("match tag = +3", () => {
    expect(scoreDocument(makeDoc({ tags: ["tourisme"] }), ["tourisme"])).toBe(3);
  });

  it("match excerpt = +2", () => {
    expect(scoreDocument(makeDoc({ excerpt: "tourisme" }), ["tourisme"])).toBe(2);
  });

  it("match body = +1", () => {
    expect(scoreDocument(makeDoc({ content: "<p>tourisme côtier</p>" }), ["tourisme"])).toBe(1);
  });

  it("score cumulatif quand plusieurs champs matchent", () => {
    const doc = makeDoc({
      title: "tourisme",
      excerpt: "tourisme",
      content: "tourisme",
      tags: ["tourisme"],
    });
    // 5 (title) + 3 (tag) + 2 (excerpt) + 1 (body) = 11
    expect(scoreDocument(doc, ["tourisme"])).toBe(11);
  });

  it("ignore les accents dans le matching", () => {
    // Note : les terms passés à `scoreDocument` doivent être déjà
    // normalisés (issus de `tokenize`). C'est le titre qui est normalisé
    // en interne — pas les terms — pour permettre le match sans accent.
    expect(scoreDocument(makeDoc({ title: "Îles du Ponant" }), ["iles"])).toBe(5);
    expect(scoreDocument(makeDoc({ title: "Iles du Ponant" }), tokenize("îles"))).toBe(5);
  });

  it("plusieurs termes additionnent leurs scores", () => {
    const doc = makeDoc({ title: "tourisme maritime" });
    expect(scoreDocument(doc, ["tourisme", "maritime"])).toBe(10);
  });

  it("ignore les balises HTML dans le body (strip via stripHtmlPreview)", () => {
    const doc = makeDoc({ content: "<p>côtier<br/>tourisme</p>" });
    expect(scoreDocument(doc, ["tourisme"])).toBe(1);
  });
});

describe("rankDocuments", () => {
  it("retourne tableau vide pour query vide", () => {
    const docs = [makeDoc({ title: "Position GASPE" })];
    expect(rankDocuments(docs, "")).toEqual([]);
  });

  it("filtre les docs avec score 0", () => {
    const docs = [
      makeDoc({ title: "AG 2026" }),
      makeDoc({ title: "tourisme" }),
    ];
    const result = rankDocuments(docs, "tourisme");
    expect(result).toHaveLength(1);
    expect(result[0].doc.title).toBe("tourisme");
  });

  it("trie par score décroissant", () => {
    const docs: ScorableDoc[] = [
      makeDoc({ title: "Notes", content: "tourisme côtier" }),    // body match : +1
      makeDoc({ title: "Tourisme maritime", tags: null }),         // title match : +5
      makeDoc({ title: "AG", tags: ["tourisme"] }),                // tag match : +3
    ];
    const result = rankDocuments(docs, "tourisme");
    expect(result).toHaveLength(3);
    expect(result[0].score).toBe(5);
    expect(result[1].score).toBe(3);
    expect(result[2].score).toBe(1);
  });

  it("multi-mots : Îles du Ponant remonte des positions sans accents", () => {
    const docs: ScorableDoc[] = [
      makeDoc({ title: "Continuité territoriale et iles du ponant" }),
      makeDoc({ title: "AG 2026" }),
    ];
    const result = rankDocuments(docs, "Îles du Ponant");
    // 3 termes ≥ 2 caractères → iles, du, ponant. Tous présents dans
    // le titre. 5 × 3 = 15.
    expect(result[0].score).toBe(15);
  });
});
