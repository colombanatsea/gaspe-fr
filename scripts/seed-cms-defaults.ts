#!/usr/bin/env npx tsx
/**
 * CMS Defaults Seed Script
 *
 * Dumps all CMS_DEFAULTS + PAGE_DEFINITIONS into a D1 INSERT script
 * so the admin sees the live content in /admin/pages out of the box.
 *
 * Usage:
 *   npx tsx scripts/seed-cms-defaults.ts > workers/migrations/0009_cms_defaults_seed.sql
 *   wrangler d1 execute gaspe-db --remote --file workers/migrations/0009_cms_defaults_seed.sql
 *
 * Idempotent : uses INSERT OR IGNORE so existing admin edits are preserved.
 */

import { CMS_DEFAULTS } from "../src/data/cms-defaults";
import { PAGE_DEFINITIONS } from "../src/lib/cms-store";

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function generate(): string {
  const now = new Date().toISOString();
  const lines: string[] = [
    "-- GASPE CMS Defaults Seed — Auto-generated",
    `-- Generated: ${now}`,
    "-- Apply (remote): wrangler d1 execute gaspe-db --remote --file workers/migrations/0009_cms_defaults_seed.sql",
    "-- This uses INSERT OR IGNORE : existing admin edits are preserved.",
    "",
  ];

  // Build a label lookup table from PAGE_DEFINITIONS for better admin UX
  const labelMap = new Map<string, string>();
  for (const pageDef of PAGE_DEFINITIONS) {
    for (const section of pageDef.sections) {
      labelMap.set(`${pageDef.id}.${section.id}`, section.label);
    }
  }

  for (const [pageId, sections] of Object.entries(CMS_DEFAULTS)) {
    lines.push(`-- Page: ${pageId}`);
    for (const [sectionId, content] of Object.entries(sections)) {
      if (!content || !content.trim()) continue;
      const pageDef = PAGE_DEFINITIONS.find((p) => p.id === pageId);
      const sectionDef = pageDef?.sections.find((s) => s.id === sectionId);
      const label = labelMap.get(`${pageId}.${sectionId}`) ?? sectionId;
      const type = sectionDef?.type ?? "text";
      lines.push(
        `INSERT OR IGNORE INTO cms_pages (page_id, section_id, label, type, content, updated_at) VALUES ('${escapeSQL(pageId)}', '${escapeSQL(sectionId)}', '${escapeSQL(label)}', '${escapeSQL(type)}', '${escapeSQL(content)}', '${escapeSQL(now)}');`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

console.log(generate());
