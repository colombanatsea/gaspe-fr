import type { MetadataRoute } from "next";
import { formations } from "@/data/formations";

export const dynamic = "force-static";

const BASE_URL = "https://www.gaspe.fr";

/**
 * Dynamic sitemap — static pages now, DB-driven pages later
 * When DB is connected, add: jobs, articles, events
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/notre-groupement`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/nos-adherents`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/nos-compagnies-recrutent`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/actualites`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/positions`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/presse`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/agenda`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/documents`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/boite-a-outils`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/formations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // TODO: When DB is connected, add dynamic pages:
  // const jobs = await db.select({ slug: jobsTable.slug, updatedAt: jobsTable.updatedAt })
  //   .from(jobsTable).where(eq(jobsTable.published, true));
  // const jobPages = jobs.map(j => ({ url: `${BASE_URL}/nos-compagnies-recrutent/${j.slug}`, lastModified: j.updatedAt }));

  // Formation detail pages
  const formationPages: MetadataRoute.Sitemap = formations.map((f) => ({
    url: `${BASE_URL}/formations/${f.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...formationPages];
}
