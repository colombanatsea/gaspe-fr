import { describe, it, expect } from "vitest";
import { decodeHtmlEntities, stripHtmlPreview, formatPrice } from "../text-preview";

/**
 * Tests des helpers `text-preview` introduits en session 54+++ pour les
 * items A5 (strip HTML brut tuile formation), A6 (entités HTML
 * littérales sur positions / ecoles-de-la-mer) et A4 (format prix
 * automatique).
 */

describe("decodeHtmlEntities", () => {
  it("retourne une chaîne vide pour null / undefined / vide", () => {
    expect(decodeHtmlEntities("")).toBe("");
  });

  it("décode les entités nommées les plus courantes", () => {
    expect(decodeHtmlEntities("&amp;")).toBe("&");
    expect(decodeHtmlEntities("&lt;b&gt;")).toBe("<b>");
    expect(decodeHtmlEntities("&quot;hello&quot;")).toBe('"hello"');
    expect(decodeHtmlEntities("&apos;")).toBe("'");
  });

  it("décode les apostrophes numériques (A6)", () => {
    expect(decodeHtmlEntities("l&#39;équipage")).toBe("l'équipage");
    expect(decodeHtmlEntities("l&#x27;équipage")).toBe("l'équipage");
  });

  it("décode les entités françaises typographiques", () => {
    expect(decodeHtmlEntities("&laquo;hello&raquo;")).toBe("«hello»");
    expect(decodeHtmlEntities("&ndash;")).toBe("–");
    expect(decodeHtmlEntities("&mdash;")).toBe("—");
    expect(decodeHtmlEntities("&rsquo;")).toBe("’");
    expect(decodeHtmlEntities("&hellip;")).toBe("…");
  });

  it("décode les entités complétées en session 57 (ecoles-de-la-mer)", () => {
    expect(decodeHtmlEntities("&middot;")).toBe("·");
    expect(decodeHtmlEntities("&bull;")).toBe("•");
    expect(decodeHtmlEntities("&larr;")).toBe("←");
    expect(decodeHtmlEntities("&rarr;")).toBe("→");
    expect(decodeHtmlEntities("&deg;")).toBe("°");
    expect(decodeHtmlEntities("&times;")).toBe("×");
  });

  it("décode les entités numériques décimales et hexadécimales arbitraires", () => {
    expect(decodeHtmlEntities("&#233;")).toBe("é");
    expect(decodeHtmlEntities("&#x00E9;")).toBe("é");
    expect(decodeHtmlEntities("&#8364;")).toBe("€");
  });

  it("laisse intactes les entités inconnues", () => {
    expect(decodeHtmlEntities("&inexistant;")).toBe("&inexistant;");
  });

  it("préserve le texte normal sans entités", () => {
    expect(decodeHtmlEntities("Hello world")).toBe("Hello world");
  });

  it("gère plusieurs entités dans la même chaîne", () => {
    expect(decodeHtmlEntities("l&#39;&eacute;tang &amp; la mer"))
      .toBe("l'&eacute;tang & la mer"); // &eacute; n'est pas mappé en nommé, &#39; et &amp; le sont
  });
});

describe("stripHtmlPreview", () => {
  it("retourne une chaîne vide pour input vide", () => {
    expect(stripHtmlPreview("")).toBe("");
    expect(stripHtmlPreview("   ")).toBe("");
  });

  it("retire les balises HTML les plus communes", () => {
    expect(stripHtmlPreview("<p>Hello</p>")).toBe("Hello");
    expect(stripHtmlPreview("<table><tr><td>cell</td></tr></table>")).toBe("cell");
  });

  it("strip + decode entities sur une description riche", () => {
    // Les balises sont remplacées par des espaces (évite de coller des
    // mots séparés par des tags), normalisation des espaces ensuite.
    const html = "<p>l&#39;<strong>équipage</strong> &middot; 5 marins</p>";
    expect(stripHtmlPreview(html)).toBe("l' équipage · 5 marins");
  });

  it("normalise les espaces multiples", () => {
    expect(stripHtmlPreview("a   b\n\nc")).toBe("a b c");
  });

  it("tronque à la longueur max avec ellipsis", () => {
    const long = "a".repeat(300);
    const out = stripHtmlPreview(long, 50);
    expect(out.length).toBeLessThanOrEqual(51); // 50 + ellipsis
    expect(out.endsWith("…")).toBe(true);
  });

  it("ne tronque pas si plus court que max", () => {
    expect(stripHtmlPreview("court", 200)).toBe("court");
    expect(stripHtmlPreview("court", 200).endsWith("…")).toBe(false);
  });
});

describe("formatPrice", () => {
  it("retourne chaîne vide pour vide / null / undefined", () => {
    expect(formatPrice(undefined)).toBe("");
    expect(formatPrice(null)).toBe("");
    expect(formatPrice("")).toBe("");
    expect(formatPrice("   ")).toBe("");
  });

  it("ajoute « € » à un nombre brut (A4 feedback)", () => {
    expect(formatPrice(1200)).toBe("1200 €");
    expect(formatPrice("1200")).toBe("1200 €");
    expect(formatPrice("1 200")).toBe("1 200 €");
    expect(formatPrice("1 200,50")).toBe("1 200,50 €");
  });

  it("conserve une valeur qui contient déjà la devise ou une mention", () => {
    expect(formatPrice("1 200 €")).toBe("1 200 €");
    expect(formatPrice("Gratuit adhérents")).toBe("Gratuit adhérents");
    expect(formatPrice("Sur devis")).toBe("Sur devis");
    expect(formatPrice("nous consulter")).toBe("nous consulter");
    expect(formatPrice("450 EUR")).toBe("450 EUR");
  });

  it("retourne tel quel pour mention textuelle non numérique", () => {
    expect(formatPrice("À partir de 500 € HT")).toBe("À partir de 500 € HT");
  });
});
