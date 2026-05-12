"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { Badge } from "@/components/ui/Badge";
import { listPositions, type StoredPosition } from "@/lib/positions-store";
import { stripHtmlPreview } from "@/lib/text-preview";
import { rankDocuments } from "@/lib/search-scoring";

const tagVariant: Record<StoredPosition["category"], "teal" | "blue" | "warm"> = {
  Position: "teal",
  "Actualité": "blue",
  "Communiqué de presse": "warm",
};

function RechercheContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [positions, setPositions] = useState<StoredPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPositions()
      .then((list) => setPositions(list))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => rankDocuments(positions, q), [positions, q]);

  return (
    <>
      <CmsPageHeader
        pageId="recherche"
        defaultTitle="Recherche"
        defaultDescription="Cherchez parmi les prises de position, actualités et communiqués de presse du GASPE."
        breadcrumbs={[{ label: "Recherche" }]}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm text-foreground-muted">
            {q ? (
              <>
                Résultats pour <span className="font-semibold text-foreground">« {q} »</span>
              </>
            ) : (
              <>Saisissez un terme dans la barre de recherche en haut de la page d&apos;accueil.</>
            )}
          </p>
        </div>

        {loading && q && (
          <p className="py-12 text-center text-sm text-foreground-muted">Chargement…</p>
        )}

        {!loading && q && results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--gaspe-neutral-200)] bg-white/60 p-8 text-center">
            <p className="text-sm text-foreground-muted">
              Aucune position ne correspond à votre recherche.
            </p>
            <p className="mt-2 text-xs text-foreground-muted">
              Essayez aussi notre{" "}
              <Link href={`/documents?q=${encodeURIComponent(q)}`} className="text-primary underline">
                base documentaire (accords, guides, notes)
              </Link>
              .
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-foreground-muted">
              {results.length} position{results.length > 1 ? "s" : ""} trouvée{results.length > 1 ? "s" : ""}
            </p>
            <ul className="space-y-4">
              {results.map(({ doc: position }) => (
                <li key={position.id}>
                  <Link
                    href={`/positions/${position.slug}`}
                    className="group block rounded-xl bg-background border border-border-light p-6 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <article>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={tagVariant[position.category]}>{position.category}</Badge>
                          <h2 className="font-heading text-lg font-semibold text-foreground">
                            {position.title}
                          </h2>
                        </div>
                        <time
                          className="shrink-0 text-xs text-foreground-muted"
                          dateTime={position.date}
                        >
                          {position.date}
                        </time>
                      </div>
                      <p className="mt-2 text-sm text-foreground-muted line-clamp-3">
                        {stripHtmlPreview(position.excerpt || position.content, 220)}
                      </p>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-xl border border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-teal-50)] p-4 text-sm">
              <p className="text-foreground">
                Vous cherchez aussi un document, un accord ou un guide ?{" "}
                <Link
                  href={`/documents?q=${encodeURIComponent(q)}`}
                  className="font-semibold text-primary underline"
                >
                  Voir la base documentaire
                </Link>
                .
              </p>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-foreground-muted">Chargement…</p>}>
      <RechercheContent />
    </Suspense>
  );
}
