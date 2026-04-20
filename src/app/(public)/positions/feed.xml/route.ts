import { positions } from "@/data/positions";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export const dynamic = "force-static";

/**
 * Flux RSS 2.0 des positions, tribunes et actualités du GASPE.
 *
 * URL : `${SITE_URL}/positions/feed.xml`
 * Exposé en static export (pas de re-génération au runtime).
 * Re-bascule un build à chaque ajout/modif d'entrée dans `src/data/positions.ts`.
 */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(date: string): string {
  return new Date(`${date}T12:00:00Z`).toUTCString();
}

export async function GET() {
  const sorted = [...positions].sort((a, b) =>
    b.datePublished.localeCompare(a.datePublished),
  );

  const lastBuild = sorted[0]?.datePublished ?? new Date().toISOString().slice(0, 10);

  const items = sorted
    .map((p) => {
      const link = `${SITE_URL}/positions/${p.slug}`;
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(p.datePublished)}</pubDate>
      <category>${escapeXml(p.tag)}</category>
      <description>${escapeXml(p.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} – Positions &amp; Actualités</title>
    <link>${SITE_URL}/positions</link>
    <atom:link href="${SITE_URL}/positions/feed.xml" rel="self" type="application/rss+xml" />
    <description>Positions, tribunes et prises de parole du GASPE sur le maritime côtier, la transition écologique, la continuité territoriale et la CCN 3228.</description>
    <language>fr</language>
    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
