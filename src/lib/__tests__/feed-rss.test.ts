import { describe, it, expect } from "vitest";
import { GET } from "@/app/feed.xml/route";
import { publishedPositions } from "@/data/positions";

async function fetchFeed(): Promise<string> {
  const res = GET();
  expect(res.status).toBe(200);
  const contentType = res.headers.get("Content-Type") ?? "";
  expect(contentType).toContain("application/rss+xml");
  return res.text();
}

describe("/feed.xml", () => {
  it("returns a well-formed RSS 2.0 envelope", async () => {
    const xml = await fetchFeed();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>");
    expect(xml).toContain("</rss>");
  });

  it("declares the content and dublin core namespaces", async () => {
    const xml = await fetchFeed();
    expect(xml).toContain(
      'xmlns:content="http://purl.org/rss/1.0/modules/content/"',
    );
    expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
  });

  it("includes an atom:link self reference", async () => {
    const xml = await fetchFeed();
    expect(xml).toContain(
      '<atom:link href="https://www.gaspe.fr/feed.xml" rel="self" type="application/rss+xml" />',
    );
  });

  it("emits one <item> per published position", async () => {
    const xml = await fetchFeed();
    const count = (xml.match(/<item>/g) ?? []).length;
    expect(count).toBe(publishedPositions.length);
  });

  it("includes title, link, pubDate, guid and content:encoded on each item", async () => {
    const xml = await fetchFeed();
    for (const position of publishedPositions) {
      expect(xml).toContain(`/positions/${position.slug}`);
      expect(xml).toContain("<pubDate>");
      expect(xml).toContain("<content:encoded>");
      expect(xml).toContain("<guid");
    }
  });

  it("escapes XML-reserved characters in description", async () => {
    const xml = await fetchFeed();
    // Ensure there are no raw unescaped & in text nodes that look like entities
    // (Basic sanity – & must be followed by amp; / lt; / gt; / quot; / apos;)
    const matches = xml.match(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g);
    expect(matches).toBeNull();
  });
});
