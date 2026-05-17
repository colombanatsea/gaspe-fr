import { describe, it, expect } from "vitest";
import { sanitize, sanitizeRichHtml } from "../sanitize";

describe("sanitize (échappement texte brut)", () => {
  it("retourne une chaîne vide pour une entrée vide", () => {
    expect(sanitize("")).toBe("");
  });

  it("préserve un texte simple sans caractères spéciaux", () => {
    expect(sanitize("bonjour le monde")).toBe("bonjour le monde");
  });

  it("échappe les chevrons HTML", () => {
    expect(sanitize("<div>x</div>")).toBe("&lt;div&gt;x&lt;/div&gt;");
  });

  it("échappe l'ampersand", () => {
    expect(sanitize("a & b")).toBe("a &amp; b");
  });

  it("échappe les guillemets doubles", () => {
    expect(sanitize('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("échappe les apostrophes", () => {
    expect(sanitize("c'est")).toBe("c&#39;est");
  });

  it("échappe tous les caractères dangereux ensemble", () => {
    expect(sanitize(`<a href="x" onclick="alert('xss')">click</a>`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&quot;alert(&#39;xss&#39;)&quot;&gt;click&lt;/a&gt;",
    );
  });

  it("préserve accents et caractères Unicode non dangereux", () => {
    expect(sanitize("éàùç")).toBe("éàùç");
  });
});

describe("sanitizeRichHtml (HTML enrichi)", () => {
  it("retourne une chaîne vide pour une entrée vide ou null", () => {
    expect(sanitizeRichHtml("")).toBe("");
  });

  it("préserve les balises inline non dangereuses", () => {
    expect(sanitizeRichHtml("<p>texte <strong>gras</strong></p>")).toBe(
      "<p>texte <strong>gras</strong></p>",
    );
  });

  it("supprime les balises <script> complètes", () => {
    expect(sanitizeRichHtml('<p>ok</p><script>alert(1)</script>')).toBe(
      "<p>ok</p>",
    );
  });

  it("supprime les balises <style> complètes", () => {
    expect(sanitizeRichHtml('<p>ok</p><style>body{color:red}</style>')).toBe(
      "<p>ok</p>",
    );
  });

  it("supprime les balises <iframe> complètes", () => {
    expect(
      sanitizeRichHtml('<p>ok</p><iframe src="evil.com"></iframe>'),
    ).toBe("<p>ok</p>");
  });

  it("supprime les handlers onclick (double-quotes)", () => {
    expect(sanitizeRichHtml('<a onclick="alert(1)">x</a>')).toBe("<a>x</a>");
  });

  it("supprime les handlers onerror (single-quotes)", () => {
    expect(sanitizeRichHtml("<img onerror='alert(1)' src='x'>")).toBe(
      "<img src='x'>",
    );
  });

  it("supprime les handlers on* sans quotes", () => {
    expect(sanitizeRichHtml("<div onmouseover=do()>x</div>")).toBe(
      "<div>x</div>",
    );
  });

  it("neutralise les URLs javascript:", () => {
    expect(sanitizeRichHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a href="alert(1)">x</a>',
    );
  });

  it("neutralise les URLs javascript: avec espaces autour du `:`", () => {
    // Le regex `javascript\s*:` consomme "javascript :" (12 chars).
    // L'espace situé APRES `:` est préservé tel quel.
    expect(sanitizeRichHtml('<a href="javascript : alert(1)">x</a>')).toBe(
      '<a href=" alert(1)">x</a>',
    );
  });

  it("gère les balises script avec attributs", () => {
    expect(
      sanitizeRichHtml('<script type="text/javascript">alert(1)</script>'),
    ).toBe("");
  });

  it("préserve plusieurs balises inline imbriquées", () => {
    expect(
      sanitizeRichHtml("<p>Un <em>texte</em> <strong>important</strong></p>"),
    ).toBe("<p>Un <em>texte</em> <strong>important</strong></p>");
  });
});
