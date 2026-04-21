import type { MetadataRoute } from "next";
import { formations } from "@/data/formations";
import { publishedJobs } from "@/data/jobs";
import { members } from "@/data/members";
import { positions } from "@/data/positions";

export const dynamic = "force-static";

const BASE_URL = "https://www.gaspe.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

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
    { url: `${BASE_URL}/ssgm`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/decouvrir-espace-adherent`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/transition-ecologique`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Job detail pages
  const jobPages: MetadataRoute.Sitemap = publishedJobs.map((j) => ({
    url: `${BASE_URL}/nos-compagnies-recrutent/${j.slug}`,
    lastModified: j.publishedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Member detail pages
  const memberPages: MetadataRoute.Sitemap = members.map((m) => ({
    url: `${BASE_URL}/nos-adherents/${m.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Formation detail pages
  const formationPages: MetadataRoute.Sitemap = formations.map((f) => ({
    url: `${BASE_URL}/formations/${f.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Position / article detail pages
  const positionPages: MetadataRoute.Sitemap = positions.map((p) => ({
    url: `${BASE_URL}/positions/${p.slug}`,
    lastModified: p.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...jobPages, ...memberPages, ...formationPages, ...positionPages];
}
