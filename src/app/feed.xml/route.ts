import { POSITIONS_SORTED } from "@/data/positions";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

// Statically exported at build time — compatible avec output: 'export' de Next.js.
export const dynamic = "force-static";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const lastBuildDate = new Date().toUTCString();
  const items = POSITIONS_SORTED
    .map((p) => {
      const link = `${SITE_URL}/positions/${p.slug}`;
      const pubDate = new Date(p.publishedAt).toUTCString();
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${esc(p.tag)}</category>
      <description>${esc(p.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} — Actualités</title>
    <link>${SITE_URL}/actualites</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(SITE_DESCRIPTION)}</description>
    <language>fr-FR</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
