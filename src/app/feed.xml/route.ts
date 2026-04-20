import { publishedPositions } from "@/data/positions";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export const dynamic = "force-static";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function GET() {
  const lastBuild = publishedPositions[0]?.publishedAt ?? new Date().toISOString();

  const items = publishedPositions
    .map((position) => {
      const url = `${SITE_URL}/positions/${position.slug}`;
      const pubDate = new Date(position.publishedAt).toUTCString();
      const description = escapeXml(stripHtml(position.excerpt));
      // CDATA-safe : close-open any ']]>' that would end the CDATA section
      const safeBody = position.body.replace(/]]>/g, "]]]]><![CDATA[>");
      return [
        "    <item>",
        `      <title>${escapeXml(position.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <category>${escapeXml(position.tag)}</category>`,
        `      <description>${description}</description>`,
        `      <content:encoded><![CDATA[${safeBody}]]></content:encoded>`,
        `      <dc:creator>${escapeXml(position.author ?? SITE_NAME)}</dc:creator>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} – Positions &amp; actualités</title>
    <link>${SITE_URL}/positions</link>
    <description>Positions, tribunes et actualités du GASPE sur le maritime côtier, la transition écologique, la continuité territoriale, la CCN 3228 et le recrutement.</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
