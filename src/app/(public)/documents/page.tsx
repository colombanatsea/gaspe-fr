"use client";

import { Suspense, useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CollapsibleSources } from "@/components/shared/CollapsibleSources";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { Badge } from "@/components/ui/Badge";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";
import { listDocuments } from "@/lib/documents-store";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
  type GaspeDocument,
} from "@/data/documents-seed";

const D = (s: string) => getCmsDefault("documents", s);

function categoryVariant(category: DocumentCategory) {
  switch (category) {
    case "ccn-accords":
      return "teal" as const;
    case "institutionnels":
      return "blue" as const;
    case "reglementaire":
      return "warm" as const;
    case "rapports":
      return "green" as const;
  }
}

/* ------------------------------------------------------------------ */
/*  PDF icon                                                           */
/* ------------------------------------------------------------------ */

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 12h4" />
      <path d="M10 16h4" />
      <path d="M10 20h4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner component (reads search params)                              */
/* ------------------------------------------------------------------ */

function DocumentsContent() {
  const revealRef = useScrollReveal();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const [documents, setDocuments] = useState<GaspeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const searchPlaceholder = useCmsContent(
    "documents",
    "search-placeholder",
    D("search-placeholder"),
  );
  const emptyState = useCmsContent(
    "documents",
    "empty-state",
    D("empty-state"),
  );

  useEffect(() => {
    startTransition(() => {
      setLoading(true);
      listDocuments(false).then((docs) => {
        setDocuments(docs);
        setLoading(false);
      });
    });
  }, []);

  function handleDownload(doc: GaspeDocument) {
    if (doc.fileUrl === "#" || !doc.fileUrl) {
      setToast(
        `« ${doc.title} » sera disponible au téléchargement prochainement.`,
      );
      setTimeout(() => setToast(""), 4000);
    }
  }

  const filtered = useMemo(() => {
    let items = [...documents];

    if (activeCategory) {
      items = items.filter((d) => d.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q),
      );
    }

    return items;
  }, [documents, search, activeCategory]);

  // Group filtered results by category for display
  const grouped = useMemo(() => {
    const map = new Map<DocumentCategory, GaspeDocument[]>();
    for (const doc of filtered) {
      const list = map.get(doc.category) || [];
      list.push(doc);
      map.set(doc.category, list);
    }
    return DOCUMENT_CATEGORIES.filter((cat) => map.has(cat)).map((cat) => ({
      category: cat,
      docs: map.get(cat)!,
    }));
  }, [filtered]);

  return (
    <div
      ref={revealRef}
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      {/* Search + category filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10 reveal">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Rechercher un document"
            className="w-full rounded-xl border border-border-light bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              activeCategory === null
                ? "bg-primary text-white"
                : "bg-surface text-foreground-muted hover:bg-surface-teal"
            }`}
          >
            Tous
          </button>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-surface text-foreground-muted hover:bg-surface-teal"
              }`}
            >
              {DOCUMENT_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-foreground-muted text-sm py-8 text-center">
          Chargement des documents…
        </p>
      ) : grouped.length === 0 ? (
        <p className="text-foreground-muted text-sm py-8 text-center">
          {emptyState}
        </p>
      ) : (
        <div className="space-y-12">
          {grouped.map(({ category, docs }, groupIdx) => (
            <section key={category} className={`reveal stagger-${groupIdx + 1}`}>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                {DOCUMENT_CATEGORY_LABELS[category]}
              </h2>
              <div className="space-y-4">
                {docs.map((doc) => (
                  <article
                    key={doc.id}
                    className="rounded-xl bg-background border-l-[3px] border-l-primary p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gaspe-teal-600)]/10 text-[var(--gaspe-teal-600)]">
                          <PdfIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant={categoryVariant(doc.category)}>
                              {DOCUMENT_CATEGORY_LABELS[doc.category]}
                            </Badge>
                            {doc.publishedAt && (
                              <time
                                className="text-xs text-foreground-muted"
                                dateTime={doc.publishedAt}
                              >
                                {new Date(doc.publishedAt).toLocaleDateString(
                                  "fr-FR",
                                  { year: "numeric", month: "long" },
                                )}
                              </time>
                            )}
                            {!doc.isPublic && (
                              <Badge variant="neutral">Adhérents</Badge>
                            )}
                          </div>
                          <h3 className="font-heading text-lg font-semibold text-foreground">
                            {doc.title}
                          </h3>
                          {doc.description && (
                            <p className="mt-1 text-sm text-foreground-muted">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Download button */}
                      {doc.fileUrl && doc.fileUrl !== "#" ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-surface-teal transition-colors"
                          download
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Télécharger
                        </a>
                      ) : (
                        <button
                          onClick={() => handleDownload(doc)}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--gaspe-neutral-300)] px-4 py-2.5 text-sm font-medium text-foreground-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                          Bientôt disponible
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg rounded-xl bg-[var(--gaspe-neutral-900)] px-5 py-3 text-sm text-white shadow-xl animate-[fadeInUp_0.3s_ease-out]">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 shrink-0 text-[var(--gaspe-teal-400)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
            <p>{toast}</p>
            <button
              onClick={() => setToast("")}
              className="shrink-0 text-white/50 hover:text-white cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Sources */}
      <CollapsibleSources className="mt-12">
        <p className="text-xs text-foreground-muted leading-relaxed">
          Documents issus des travaux du GASPE et des partenaires sociaux de la
          branche. CCN 3228 (IDCC 3228) et accords de branche également
          disponibles sur Legifrance.
        </p>
      </CollapsibleSources>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (wraps content in Suspense for useSearchParams)               */
/* ------------------------------------------------------------------ */

function DocumentsHeader() {
  const toolkitTitle = useCmsContent(
    "documents",
    "toolkit-cta-title",
    D("toolkit-cta-title"),
  );
  const toolkitDescription = useCmsContent(
    "documents",
    "toolkit-cta-description",
    D("toolkit-cta-description"),
  );
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
      <Link
        href="/boite-a-outils"
        className="group flex items-center gap-4 rounded-2xl border border-border-light bg-surface-teal p-5 hover:shadow-md transition-shadow"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {toolkitTitle}
          </p>
          <p className="text-sm text-foreground-muted">{toolkitDescription}</p>
        </div>
        <svg
          className="h-5 w-5 text-foreground-muted group-hover:text-primary transition-colors shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <>
      <CmsPageHeader
        pageId="documents"
        defaultTitle="Documents"
        defaultDescription="Documents officiels, convention collective, accords de branche et outils pratiques du GASPE."
        breadcrumbs={[{ label: "Documents" }]}
      />
      <DocumentsHeader />
      <Suspense fallback={null}>
        <DocumentsContent />
      </Suspense>
    </>
  );
}
