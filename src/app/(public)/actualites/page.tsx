import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { BreadcrumbJsonLd } from "@/components/shared/SEOJsonLd";
import { buildMetadata } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { publishedPositions, type PositionTag } from "@/data/positions";

export const metadata: Metadata = buildMetadata({
  title: "Actualités maritimes côtières",
  description:
    "Les actualités et positions du GASPE sur le transport maritime côtier français : AG, CCN 3228, décarbonation, continuité territoriale, recrutement maritime.",
  path: "/actualites",
  keywords: ["actualités maritime côtier", "positions GASPE", "veille maritime", "maritime côtier actualité"],
});

function tagVariant(tag: PositionTag) {
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
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: SITE_NAME, url: SITE_URL },
          { name: "Actualités", url: `${SITE_URL}/actualites` },
        ]}
      />

      <PageHeader
        title="Actualités"
        description="Toutes les prises de parole et actualités récentes du GASPE – flux mis à jour en continu."
        breadcrumbs={[{ label: "Actualités" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <p className="text-sm text-foreground-muted max-w-2xl">
            Retrouvez ici les dernières positions, communiqués et actualités du Groupement. Vous
            pouvez également vous abonner au flux RSS pour recevoir les nouveautés dans votre
            lecteur favori.
          </p>
          <Link
            href="/feed.xml"
            className="inline-flex items-center gap-2 rounded-xl border border-primary text-primary px-4 py-2 text-xs font-semibold hover:bg-surface-teal transition-colors shrink-0"
            aria-label="Flux RSS des actualités GASPE"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18A2.18 2.18 0 0 1 6.18 20a2.18 2.18 0 0 1-2.18-2.18 2.18 2.18 0 0 1 2.18-2.18zM4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
            </svg>
            Flux RSS
          </Link>
        </div>

        {publishedPositions.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--gaspe-neutral-200)] bg-white/60 p-8 text-center text-sm text-foreground-muted">
            Aucune actualité ou position publiée pour le moment. Revenez
            bientôt – le flux RSS vous préviendra automatiquement.
          </div>
        )}

        <div className="space-y-4">
          {publishedPositions.map((position) => (
            <Link
              key={position.slug}
              href={`/positions/${position.slug}`}
              className="block rounded-xl bg-background border-l-[3px] border-l-warm p-6 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <article>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={tagVariant(position.tag)}>{position.tag}</Badge>
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {position.title}
                    </h2>
                  </div>
                  <time
                    className="shrink-0 text-xs text-foreground-muted"
                    dateTime={position.publishedAt}
                  >
                    {position.date}
                  </time>
                </div>
                <p className="mt-2 text-sm text-foreground-muted line-clamp-2">
                  {position.excerpt}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
