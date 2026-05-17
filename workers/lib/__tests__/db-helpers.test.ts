import { describe, it, expect } from "vitest";
import {
  safeJsonParse,
  numOrNull,
  strOrNull,
  boolToInt,
  slugify,
} from "../db-helpers";

describe("safeJsonParse", () => {
  it("retourne fallback pour null", () => {
    expect(safeJsonParse(null, [])).toEqual([]);
  });

  it("retourne fallback pour undefined", () => {
    expect(safeJsonParse(undefined, "default")).toBe("default");
  });

  it("retourne fallback pour chaîne vide", () => {
    expect(safeJsonParse("", [])).toEqual([]);
  });

  it("parse un array valide", () => {
    expect(safeJsonParse<string[]>('["a","b"]', [])).toEqual(["a", "b"]);
  });

  it("parse un objet valide", () => {
    expect(safeJsonParse<{ k: number }>('{"k":42}', { k: 0 })).toEqual({ k: 42 });
  });

  it("retourne fallback pour JSON malformé", () => {
    expect(safeJsonParse("{not json", [])).toEqual([]);
  });

  it("parse les valeurs primitives JSON", () => {
    expect(safeJsonParse<number>("42", 0)).toBe(42);
    expect(safeJsonParse<boolean>("true", false)).toBe(true);
    expect(safeJsonParse<null>("null", "fallback" as unknown as null)).toBeNull();
  });
});

describe("numOrNull", () => {
  it("retourne null pour null/undefined/empty", () => {
    expect(numOrNull(null)).toBeNull();
    expect(numOrNull(undefined)).toBeNull();
    expect(numOrNull("")).toBeNull();
  });

  it("préserve un nombre fini", () => {
    expect(numOrNull(42)).toBe(42);
    expect(numOrNull(0)).toBe(0);
    expect(numOrNull(-1.5)).toBe(-1.5);
  });

  it("rejette les nombres non finis", () => {
    expect(numOrNull(NaN)).toBeNull();
    expect(numOrNull(Infinity)).toBeNull();
    expect(numOrNull(-Infinity)).toBeNull();
  });

  it("parse les strings numériques", () => {
    expect(numOrNull("42")).toBe(42);
    expect(numOrNull("3.14")).toBe(3.14);
    expect(numOrNull("-10")).toBe(-10);
  });

  it("supporte la virgule décimale FR", () => {
    expect(numOrNull("3,14")).toBe(3.14);
    expect(numOrNull("1234,56")).toBe(1234.56);
  });

  it("retourne null pour les strings non numériques", () => {
    expect(numOrNull("abc")).toBeNull();
    expect(numOrNull("12abc")).toBeNull();
  });

  it("gère les types inattendus (comportement JS documenté)", () => {
    // Object → String(...) = "[object Object]" → Number(...) = NaN → null
    expect(numOrNull({})).toBeNull();
    // Array vide → String([]) = "" → Number("") = 0 (quirk JS)
    expect(numOrNull([])).toBe(0);
    // Boolean → String() = "true"/"false" → Number(...) = NaN → null
    expect(numOrNull(true)).toBeNull();
    expect(numOrNull(false)).toBeNull();
  });
});

describe("strOrNull", () => {
  it("retourne null pour null/undefined", () => {
    expect(strOrNull(null)).toBeNull();
    expect(strOrNull(undefined)).toBeNull();
  });

  it("retourne null pour string vide ou whitespace", () => {
    expect(strOrNull("")).toBeNull();
    expect(strOrNull("   ")).toBeNull();
    expect(strOrNull("\t\n")).toBeNull();
  });

  it("trim et retourne la string", () => {
    expect(strOrNull("  hello  ")).toBe("hello");
    expect(strOrNull("simple")).toBe("simple");
  });

  it("convertit les autres types en string puis trim", () => {
    expect(strOrNull(42)).toBe("42");
    expect(strOrNull(true)).toBe("true");
  });

  it("préserve les accents et caractères Unicode", () => {
    expect(strOrNull("éàç")).toBe("éàç");
  });
});

describe("boolToInt", () => {
  it("true ou 1 ou '1' ou 'true' → 1", () => {
    expect(boolToInt(true)).toBe(1);
    expect(boolToInt(1)).toBe(1);
    expect(boolToInt("1")).toBe(1);
    expect(boolToInt("true")).toBe(1);
    expect(boolToInt("True")).toBe(1);
    expect(boolToInt("  TRUE  ")).toBe(1);
  });

  it("false / 0 / autres strings → 0", () => {
    expect(boolToInt(false)).toBe(0);
    expect(boolToInt(0)).toBe(0);
    expect(boolToInt("0")).toBe(0);
    expect(boolToInt("false")).toBe(0);
    expect(boolToInt("anything")).toBe(0);
    expect(boolToInt("")).toBe(0);
  });

  it("null / undefined / objets → 0", () => {
    expect(boolToInt(null)).toBe(0);
    expect(boolToInt(undefined)).toBe(0);
    expect(boolToInt({})).toBe(0);
    expect(boolToInt([])).toBe(0);
  });
});

describe("slugify", () => {
  it("retourne chaîne vide pour entrée vide", () => {
    expect(slugify("")).toBe("");
  });

  it("convertit en lowercase + remplace espaces par tirets", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strip les diacritiques", () => {
    expect(slugify("Décarbonation maritime")).toBe("decarbonation-maritime");
    expect(slugify("ÊTRE OU NE PAS ÊTRE")).toBe("etre-ou-ne-pas-etre");
    expect(slugify("naïveté")).toBe("naivete");
    expect(slugify("Saint-Pierre-et-Miquelon")).toBe("saint-pierre-et-miquelon");
  });

  it("remplace la ponctuation par des tirets", () => {
    expect(slugify("hello, world!")).toBe("hello-world");
    expect(slugify("a/b c\\d")).toBe("a-b-c-d");
  });

  it("trim les tirets en début/fin", () => {
    expect(slugify("-leading")).toBe("leading");
    expect(slugify("trailing-")).toBe("trailing");
    expect(slugify("---hello---")).toBe("hello");
  });

  it("compresse les séparateurs consécutifs", () => {
    expect(slugify("a    b")).toBe("a-b");
    expect(slugify("a---b")).toBe("a-b");
    expect(slugify("a   ---   b")).toBe("a-b");
  });

  it("tronque à maxLength (défaut 64)", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBe(64);
  });

  it("respecte maxLength custom dans la plage 1-200", () => {
    expect(slugify("a".repeat(50), 10)).toBe("aaaaaaaaaa");
    expect(slugify("a".repeat(300), 200).length).toBe(200);
  });

  it("clamp maxLength hors plage", () => {
    expect(slugify("abc", 0)).toBe("a"); // clamp à 1
    expect(slugify("a".repeat(300), 9999).length).toBe(200); // clamp à 200
  });

  it("retourne chaîne vide pour texte sans alphanumeric", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("---")).toBe("");
  });

  it("supporte les chiffres", () => {
    expect(slugify("CCN 3228 v2026")).toBe("ccn-3228-v2026");
  });
});
