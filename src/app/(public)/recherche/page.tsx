"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { Badge } from "@/components/ui/Badge";
import { listPositions, type StoredPosition } from "@/lib/positions-store";
import { listDocuments } from "@/lib/documents-store";
import type { GaspeDocument } from "@/data/documents-seed";
import { stripHtmlPreview } from "@/lib/text-preview";
import { rankDocuments } from "@/lib/search-scoring";

const tagVariant: Record<StoredPosition["category"], "teal" | "blue" | "warm"> = {
  Position: "teal",
  "Actualité": "blue",
  "Communiqué de presse": "warm",
};

const DOC_CATEGORY_LABEL: Record<string, string> = {
  "ccn-accords": "CCN & accords",
  institutionnels: "Institutionnels",
  reglementaire: "Réglementaire",
  rapports: "Rapports",
};

function RechercheContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [positions, setPositions] = useState<StoredPosition[]>([]);
  const [documents, setDocuments] = useState<GaspeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listPositions(), listDocuments(false)])
      .then(([pos, docs]) => {
        setPositions(pos);
        setDocuments(docs);
      })
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => rankDocuments(positions, q), [positions, q]);
  const docResults = useMemo(
    () =>
      rankDocuments(
        documents.map((d) => ({
          ...d,
          // Adapter au ScorableDoc : description sert d'excerpt.
          excerpt: d.description,
          content: "",
          tags: [d.category, d.fileName ?? ""],
        })),
        q,
      ),
    [documents, q],
  );

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

        {!loading && q && results.length === 0 && docResults.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--gaspe-neutral-200)] bg-white/60 p-8 text-center">
            <p className="text-sm text-foreground-muted">
              Aucun résultat ne correspond à votre recherche dans les positions ni dans la base documentaire.
            </p>
            <p className="mt-2 text-xs text-foreground-muted">
              Essayez un autre terme ou parcourez directement{" "}
              <Link href="/documents" className="text-primary underline">
                la base documentaire
              </Link>
              .
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-foreground-muted">
              {results.length} position{results.length > 1 ? "s" : ""}
            </p>
            <ul className="space-y-4 mb-12">
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
          </>
        )}

        {!loading && docResults.length > 0 && (
          <>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-foreground-muted">
              {docResults.length} document{docResults.length > 1 ? "s" : ""}
            </p>
            <ul className="space-y-4">
              {docResults.map(({ doc }) => (
                <li key={doc.id}>
                  <Link
                    href={`/documents?q=${encodeURIComponent(q)}`}
                    className="group block rounded-xl bg-background border border-border-light p-6 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <article>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="teal">{DOC_CATEGORY_LABEL[doc.category] ?? doc.category}</Badge>
                          <h2 className="font-heading text-lg font-semibold text-foreground">
                            {doc.title}
                          </h2>
                        </div>
                        {doc.publishedAt && (
                          <time className="shrink-0 text-xs text-foreground-muted" dateTime={doc.publishedAt}>
                            {new Date(doc.publishedAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                          </time>
                        )}
                      </div>
                      {doc.description && (
                        <p className="mt-2 text-sm text-foreground-muted line-clamp-3">
                          {doc.description}
                        </p>
                      )}
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
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
