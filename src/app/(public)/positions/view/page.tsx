"use client";

/**
 * /positions/view?slug=X — fiche position publique en mode dynamique.
 *
 * Pourquoi cette route en plus de /positions/[slug] ?
 * Le site est en `output: 'export'` (static export Cloudflare Pages).
 * `/positions/[slug]` est SSG — ses paramètres sont fixés au build à partir
 * de `src/data/positions.ts`. Les positions créées par l'admin via /admin/positions
 * (D1) ne peuvent donc pas être servies par cette route après le build.
 *
 * Cette route /positions/view est un Client Component qui prend `?slug=X` en
 * query param et fetch via `listPositions()` (mode prod = D1, mode demo = localStorage).
 *
 * La liste publique /positions linke vers cette route pour les positions D1.
 *
 * Backlog P1 : sitemap.xml + RSS feed.xml ne reflètent pas (encore) les
 * positions D1 — uniquement le seed `data/positions.ts` au build.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { getPosition, type StoredPosition } from "@/lib/positions-store";

function tagVariantForCategory(cat: StoredPosition["category"]) {
  switch (cat) {
    case "Position":
      return "teal" as const;
    case "Actualité":
      return "blue" as const;
    case "Communiqué de presse":
      return "warm" as const;
  }
}

function PositionViewInner() {
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";
  const [position, setPosition] = useState<StoredPosition | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) {
      setPosition(null);
      return;
    }
    getPosition(slug).then(setPosition).catch(() => setPosition(null));
  }, [slug]);

  if (position === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-[var(--gaspe-neutral-200)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--gaspe-neutral-200)]" />
          <div className="h-32 w-full rounded bg-[var(--gaspe-neutral-100)]" />
        </div>
      </div>
    );
  }

  if (!position) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={position.title}
        description={position.excerpt}
        breadcrumbs={[
          { label: "Positions", href: "/positions" },
          { label: position.title },
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge variant={tagVariantForCategory(position.category)}>{position.category}</Badge>
            {position.date && (
              <time
                className="text-xs font-medium text-foreground-muted"
                dateTime={position.date}
              >
                {position.date}
              </time>
            )}
          </div>
          {position.excerpt && (
            <p className="text-base text-foreground-muted leading-relaxed">
              {position.excerpt}
            </p>
          )}
        </header>

        <div
          className="prose prose-sm sm:prose-base max-w-none
            prose-headings:font-heading prose-headings:text-foreground
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-foreground-muted prose-p:leading-relaxed
            prose-li:text-foreground-muted
            prose-strong:text-foreground
            prose-a:text-primary hover:prose-a:text-primary-hover prose-a:font-medium prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(position.content ?? "") }}
        />

        <footer className="mt-12 pt-8 border-t border-border-light flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Link
            href="/positions"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            &larr; Toutes les positions
          </Link>
          <a
            href={`mailto:contact@gaspe.fr?subject=${encodeURIComponent(
              `Demande de précisions : ${position.title}`,
            )}`}
            className="inline-flex items-center gap-2 rounded-xl border border-primary text-primary px-4 py-2 text-sm font-medium hover:bg-surface-teal transition-colors"
          >
            Contact presse
          </a>
        </footer>
      </article>
    </>
  );
}

export default function PositionViewPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8" />}>
      <PositionViewInner />
    </Suspense>
  );
}
