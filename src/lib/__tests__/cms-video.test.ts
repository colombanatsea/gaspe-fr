import { describe, it, expect } from "vitest";
import { parseVideoPayload, parseButtonGroup, BUTTON_GROUP_FIELDS } from "@/lib/cms-store";

describe("parseVideoPayload", () => {
  it("parse un payload complet", () => {
    const json = JSON.stringify({
      url: "/assets/hero.mp4",
      poster: "/og.png",
      autoplay: true,
      loop: true,
      muted: true,
    });
    expect(parseVideoPayload(json)).toEqual({
      url: "/assets/hero.mp4",
      poster: "/og.png",
      autoplay: true,
      loop: true,
      muted: true,
    });
  });

  it("retourne null pour une string vide", () => {
    expect(parseVideoPayload("")).toBeNull();
    expect(parseVideoPayload("   ")).toBeNull();
  });

  it("retourne null pour un JSON malformé", () => {
    expect(parseVideoPayload("{not json")).toBeNull();
  });

  it("retourne null si url manquante ou non-string", () => {
    expect(parseVideoPayload(JSON.stringify({}))).toBeNull();
    expect(parseVideoPayload(JSON.stringify({ url: "" }))).toBeNull();
    expect(parseVideoPayload(JSON.stringify({ url: 42 }))).toBeNull();
  });

  it("normalise les booléens", () => {
    const json = JSON.stringify({
      url: "/v.mp4",
      autoplay: "yes",
      loop: 0,
      muted: undefined,
    });
    const payload = parseVideoPayload(json);
    expect(payload?.autoplay).toBe(true);
    expect(payload?.loop).toBe(false);
    expect(payload?.muted).toBe(false);
  });

  it("gère poster optionnel", () => {
    const noPoster = parseVideoPayload(JSON.stringify({ url: "/v.mp4" }));
    expect(noPoster?.poster).toBeUndefined();

    const withPoster = parseVideoPayload(JSON.stringify({ url: "/v.mp4", poster: "/p.png" }));
    expect(withPoster?.poster).toBe("/p.png");
  });
});

describe("parseButtonGroup", () => {
  it("retourne tableau vide pour contenu vide/invalide", () => {
    expect(parseButtonGroup("")).toEqual([]);
    expect(parseButtonGroup("   ")).toEqual([]);
    expect(parseButtonGroup("{pas du json")).toEqual([]);
    expect(parseButtonGroup("\"string au lieu de array\"")).toEqual([]);
  });

  it("parse un tableau de boutons valides", () => {
    const json = JSON.stringify([
      { label: "Adhérer", url: "/contact", variant: "primary" },
      { label: "En savoir plus", url: "/notre-groupement", variant: "secondary" },
    ]);
    expect(parseButtonGroup(json)).toEqual([
      { label: "Adhérer", url: "/contact", variant: "primary" },
      { label: "En savoir plus", url: "/notre-groupement", variant: "secondary" },
    ]);
  });

  it("filtre les items sans label ou url", () => {
    const json = JSON.stringify([
      { label: "OK", url: "/a" },
      { label: "", url: "/b" },
      { url: "/c" },
      { label: "ABC" },
    ]);
    const result = parseButtonGroup(json);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("OK");
  });

  it("default variant = primary si variant inconnu", () => {
    const json = JSON.stringify([{ label: "X", url: "/x", variant: "invalid" }]);
    expect(parseButtonGroup(json)[0].variant).toBe("primary");
  });

  it("BUTTON_GROUP_FIELDS expose 3 champs (label, url, variant)", () => {
    expect(BUTTON_GROUP_FIELDS).toHaveLength(3);
    expect(BUTTON_GROUP_FIELDS.map((f) => f.id)).toEqual(["label", "url", "variant"]);
  });
});
