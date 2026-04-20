import Link from "next/link";
import type { Metadata } from "next";
import { POSITIONS_SORTED } from "@/data/positions";
import { PageHeader } from "@/components/shared/PageHeader";
import { BreadcrumbJsonLd } from "@/components/shared/SEOJsonLd";
import { buildMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = buildMetadata({
  title: "Actualités maritimes côtier — GASPE",
  description:
    "Dernières actualités, positions et prises de parole du GASPE sur le transport maritime côtier, la CCN 3228, la décarbonation et la continuité territoriale.",
  path: "/actualites",
  keywords: ["actualités maritimes", "news armateurs", "maritime côtier actualité"],
});

function tagVariant(tag: "Position" | "Actualité" | "Presse") {
  switch (tag) {
    case "Position":
      return "teal" as const;
    case "Actualité":
      return "blue" as const;
    case "Presse":
      return "warm" as const;
  }
}

export default function ActualitesPage() {
  const items = POSITIONS_SORTED;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "GASPE", url: SITE_URL },
          { name: "Actualités", url: `${SITE_URL}/actualites` },
        ]}
      />
      <PageHeader
        title="Actualités"
        description="Positions, tribunes et prises de parole du GASPE sur les grands enjeux du maritime côtier français."
        breadcrumbs={[{ label: "Actualités" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-foreground-muted">
            {items.length} publication{items.length > 1 ? "s" : ""}
          </p>
          <a
            href="/feed.xml"
            className="inline-flex items-center gap-2 rounded-xl border border-primary text-primary px-4 py-2 text-xs font-medium hover:bg-surface-teal transition-colors"
            aria-label="Flux RSS des actualités"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M5.5 19a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM3 8.5v3a8.5 8.5 0 0 1 8.5 8.5h3A11.5 11.5 0 0 0 3 8.5zM3 3v3a14.5 14.5 0 0 1 14.5 14.5h3A17.5 17.5 0 0 0 3 3z" />
            </svg>
            Flux RSS
          </a>
        </div>

        <div className="space-y-4">
          {items.map((p) => (
            <Link
              key={p.slug}
              href={`/positions/${p.slug}`}
              className="block rounded-xl bg-background border-l-[3px] border-l-warm p-6 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={tagVariant(p.tag)}>{p.tag}</Badge>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {p.title}
                  </h3>
                </div>
                <time dateTime={p.publishedAt} className="shrink-0 text-xs text-foreground-muted">
                  {p.date}
                </time>
              </div>
              <p className="mt-2 text-sm text-foreground-muted line-clamp-2">
                {p.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
