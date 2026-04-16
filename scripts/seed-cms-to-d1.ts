#!/usr/bin/env npx tsx
/**
 * CMS Seed Script — Migrate localStorage content to D1
 *
 * Usage:
 *   1. Open the live site in a browser
 *   2. Open Dev Tools → Console
 *   3. Run: copy(localStorage.getItem('gaspe_page_content'))
 *   4. Paste the JSON into a file (e.g., cms-export.json)
 *   5. Run: npx tsx scripts/seed-cms-to-d1.ts cms-export.json > workers/migrations/0007_cms_seed.sql
 *   6. Apply: wrangler d1 execute gaspe-db --file workers/migrations/0007_cms_seed.sql
 *
 * Alternatively, you can also export jobs:
 *   copy(localStorage.getItem('gaspe_admin_offers'))
 *   npx tsx scripts/seed-cms-to-d1.ts --jobs jobs-export.json > workers/migrations/0008_jobs_seed.sql
 */

import { readFileSync } from "fs";

const args = process.argv.slice(2);
const isJobs = args.includes("--jobs");
const filePath = args.filter((a) => !a.startsWith("--"))[0];

if (!filePath) {
  console.error("Usage: npx tsx scripts/seed-cms-to-d1.ts [--jobs] <export.json>");
  console.error("");
  console.error("Export from browser console:");
  console.error('  CMS:  copy(localStorage.getItem("gaspe_page_content"))');
  console.error('  Jobs: copy(localStorage.getItem("gaspe_admin_offers"))');
  process.exit(1);
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function generateCMSSeed(jsonStr: string): string {
  const pages = JSON.parse(jsonStr) as Record<
    string,
    {
      pageId: string;
      sections: { id: string; label: string; type: string; content: string }[];
      updatedAt: string;
    }
  >;

  const lines: string[] = [
    "-- GASPE CMS Seed — Auto-generated from localStorage export",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Apply: wrangler d1 execute gaspe-db --file workers/migrations/0007_cms_seed.sql",
    "",
    "-- Clear existing CMS content (idempotent re-seed)",
    "DELETE FROM cms_pages;",
    "",
  ];

  for (const [pageId, page] of Object.entries(pages)) {
    if (!page.sections || page.sections.length === 0) continue;

    lines.push(`-- Page: ${pageId}`);
    for (const section of page.sections) {
      if (!section.content || !section.content.trim()) continue;
      lines.push(
        `INSERT INTO cms_pages (page_id, section_id, label, type, content, updated_at) VALUES ('${escapeSQL(pageId)}', '${escapeSQL(section.id)}', '${escapeSQL(section.label)}', '${escapeSQL(section.type)}', '${escapeSQL(section.content)}', '${escapeSQL(page.updatedAt || new Date().toISOString())}');`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function generateJobsSeed(jsonStr: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobs = JSON.parse(jsonStr) as any[];

  const lines: string[] = [
    "-- GASPE Jobs Seed — Auto-generated from localStorage export",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Apply: wrangler d1 execute gaspe-db --file workers/migrations/0008_jobs_seed.sql",
    "",
  ];

  for (const job of jobs) {
    const id = job.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fields = [
      ["id", id],
      ["title", job.title || ""],
      ["slug", job.slug || id],
      ["company", job.company || ""],
      ["company_slug", job.companySlug || ""],
      ["location", job.location || ""],
      ["zone", job.zone || "normandie"],
      ["contract_type", job.contractType || "CDI"],
      ["description", job.description || ""],
      ["requirements", job.requirements || ""],
      ["salary_range", job.salaryRange || ""],
      ["contact_email", job.contactEmail || ""],
      ["published", job.published ? 1 : 0],
      ["source", job.source || "admin"],
      ["published_at", job.publishedAt || new Date().toISOString()],
    ];

    const cols = fields.map(([k]) => k).join(", ");
    const vals = fields
      .map(([, v]) => (typeof v === "number" ? v : `'${escapeSQL(String(v))}'`))
      .join(", ");

    lines.push(`INSERT OR IGNORE INTO jobs (${cols}) VALUES (${vals});`);
  }

  return lines.join("\n");
}

try {
  const content = readFileSync(filePath, "utf-8");
  const sql = isJobs ? generateJobsSeed(content) : generateCMSSeed(content);
  console.log(sql);
} catch (err) {
  console.error(`Error reading ${filePath}:`, (err as Error).message);
  process.exit(1);
}
