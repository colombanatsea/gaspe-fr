/**
 * Handlers RSS / sitemap dynamiques depuis D1 (P1 SEO session 54+).
 *
 * - GET /api/feed.xml — RSS 2.0 régénéré à chaque hit (50 dernières
 *   positions publiées). Contourne la limitation static export Next.js.
 * - GET /api/sitemap-positions.xml — sitemap XML (jusqu'à 1000 positions).
 *
 * Extrait de `workers/api.ts` en J1 vague 7.a.
 */

import type { Env } from "../lib/env";
import { ensurePositionsTable, toFrontendPosition, type DbPosition } from "./positions";

const SITE_URL_FOR_FEED = "https://gaspe-fr.pages.dev";
const SITE_NAME_FOR_FEED = "GASPE";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function handleFeedXml(env: Env, corsHeaders: Record<string, string>) {
  await ensurePositionsTable(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM positions WHERE published = 1 AND is_archived = 0 ORDER BY date DESC, created_at DESC LIMIT 50",
  ).all<DbPosition>();

  const positions = (results ?? []).map(toFrontendPosition);
  const lastBuild = positions[0]?.date ?? new Date().toISOString();

  const items = positions
    .map((p) => {
      const url = `${SITE_URL_FOR_FEED}/positions/view?slug=${encodeURIComponent(p.slug)}`;
      const pubDate = (() => {
        try { return new Date(p.date).toUTCString(); } catch { return new Date().toUTCString(); }
      })();
      const description = escapeXml(stripHtml(p.excerpt ?? ""));
      const safeBody = (p.content ?? "").replace(/]]>/g, "]]]]><![CDATA[>");
      return [
        "    <item>",
        `      <title>${escapeXml(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <category>${escapeXml(p.category)}</category>`,
        `      <description>${description}</description>`,
        `      <content:encoded><![CDATA[${safeBody}]]></content:encoded>`,
        `      <dc:creator>${escapeXml(SITE_NAME_FOR_FEED)}</dc:creator>`,
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
    <title>${escapeXml(SITE_NAME_FOR_FEED)} – Positions et actualités</title>
    <link>${SITE_URL_FOR_FEED}/positions</link>
    <description>Positions, communiqués de presse et actualités du GASPE / ACF.</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL_FOR_FEED}/api/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}

export async function handleSitemapPositionsXml(env: Env, corsHeaders: Record<string, string>) {
  await ensurePositionsTable(env);
  const { results } = await env.DB.prepare(
    "SELECT slug, date, updated_at FROM positions WHERE published = 1 AND is_archived = 0 ORDER BY date DESC LIMIT 1000",
  ).all<{ slug: string; date: string | null; updated_at: string }>();

  const urls = (results ?? [])
    .map((p) => {
      const loc = `${SITE_URL_FOR_FEED}/positions/view?slug=${encodeURIComponent(p.slug)}`;
      const lastmod = p.updated_at ?? p.date ?? new Date().toISOString();
      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>`,
        "    <changefreq>monthly</changefreq>",
        "    <priority>0.7</priority>",
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=1800",
    },
  });
}
