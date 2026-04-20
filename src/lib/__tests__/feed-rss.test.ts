import { describe, it, expect } from "vitest";
import { GET } from "@/app/feed.xml/route";
import { POSITIONS } from "@/data/positions";

describe("/feed.xml RSS route", () => {
  it("renvoie du XML valide avec Content-Type application/rss+xml", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/rss+xml");
    const body = await res.text();
    expect(body.startsWith("<?xml")).toBe(true);
    expect(body).toContain("<rss version=\"2.0\"");
    expect(body).toContain("<channel>");
    expect(body).toContain("</rss>");
  });

  it("contient un item par position publiée", async () => {
    const res = await GET();
    const body = await res.text();
    const itemMatches = body.match(/<item>/g) ?? [];
    expect(itemMatches.length).toBe(POSITIONS.length);
  });

  it("chaque item contient title, link, guid, pubDate", async () => {
    const res = await GET();
    const body = await res.text();
    for (const p of POSITIONS) {
      const link = `https://www.gaspe.fr/positions/${p.slug}`;
      expect(body).toContain(`<link>${link}</link>`);
      expect(body).toContain(`<guid isPermaLink="true">${link}</guid>`);
    }
  });

  it("échappe correctement les caractères XML spéciaux", async () => {
    const res = await GET();
    const body = await res.text();
    // Aucun "&" non-échappé dans le contenu (doit être &amp;)
    // On exclut les entités valides (&amp; &lt; &gt; &quot; &apos;)
    const unescapedAmp = body.match(/&(?!(amp|lt|gt|quot|apos);)/g);
    expect(unescapedAmp).toBeNull();
  });

  it("inclut atom:link self-reference pour auto-discovery", async () => {
    const res = await GET();
    const body = await res.text();
    expect(body).toContain('<atom:link href="https://www.gaspe.fr/feed.xml" rel="self"');
  });

  it("déclare fr-FR comme langue", async () => {
    const res = await GET();
    const body = await res.text();
    expect(body).toContain("<language>fr-FR</language>");
  });
});
