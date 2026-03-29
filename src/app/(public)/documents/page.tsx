"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Category =
  | "Convention Collective et Accords de Branche"
  | "Documents Institutionnels"
  | "Publications et Notes de Position";

interface DocumentItem {
  title: string;
  category: Category;
  date?: string;
  sortKey?: string;
  href: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const documents: DocumentItem[] = [
  // Convention Collective et Accords de Branche
  {
    title:
      "Convention Collective Nationale du personnel navigant des passages d\u2019eau (CCN 3228 / IDCC 3228)",
    category: "Convention Collective et Accords de Branche",
    date: "Mars 2026",
    sortKey: "2026-03",
    href: "#",
  },
  {
    title: "Accord de branche sur les salaires",
    category: "Convention Collective et Accords de Branche",
    date: "Janvier 2026",
    sortKey: "2026-01",
    href: "#",
  },
  {
    title: "Accord de branche sur la pr\u00e9voyance compl\u00e9mentaire",
    category: "Convention Collective et Accords de Branche",
    date: "Novembre 2025",
    sortKey: "2025-11",
    href: "#",
  },
  {
    title: "Accord de branche sur la formation professionnelle",
    category: "Convention Collective et Accords de Branche",
    date: "Octobre 2025",
    sortKey: "2025-10",
    href: "#",
  },
  {
    title: "Avenant classification et grilles de salaires",
    category: "Convention Collective et Accords de Branche",
    date: "Septembre 2025",
    sortKey: "2025-09",
    href: "#",
  },

  // Documents Institutionnels
  {
    title: "Statuts du GASPE",
    category: "Documents Institutionnels",
    href: "#",
  },
  {
    title: "R\u00e8glement int\u00e9rieur",
    category: "Documents Institutionnels",
    href: "#",
  },
  {
    title: "Rapport d\u2019activit\u00e9 2025",
    category: "Documents Institutionnels",
    date: "Mars 2026",
    sortKey: "2026-03",
    href: "#",
  },
  {
    title: "Liste des membres",
    category: "Documents Institutionnels",
    date: "Janvier 2026",
    sortKey: "2026-01",
    href: "#",
  },

  // Publications et Notes de Position
  {
    title: "Transition \u00e9nerg\u00e9tique des flottes",
    category: "Publications et Notes de Position",
    date: "F\u00e9vrier 2026",
    sortKey: "2026-02",
    href: "#",
  },
  {
    title: "Accessibilit\u00e9 PMR sur les liaisons maritimes",
    category: "Publications et Notes de Position",
    date: "Janvier 2026",
    sortKey: "2026-01",
    href: "#",
  },
  {
    title: "Continuit\u00e9 territoriale et service public",
    category: "Publications et Notes de Position",
    date: "D\u00e9cembre 2025",
    sortKey: "2025-12",
    href: "#",
  },
  {
    title: "Formation et attractivit\u00e9 des m\u00e9tiers maritimes",
    category: "Publications et Notes de Position",
    date: "Novembre 2025",
    sortKey: "2025-11",
    href: "#",
  },
];

const allCategories: Category[] = [
  "Convention Collective et Accords de Branche",
  "Documents Institutionnels",
  "Publications et Notes de Position",
];

function categoryVariant(category: Category) {
  switch (category) {
    case "Convention Collective et Accords de Branche":
      return "teal" as const;
    case "Documents Institutionnels":
      return "blue" as const;
    case "Publications et Notes de Position":
      return "warm" as const;
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
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [toast, setToast] = useState("");

  function handleDownload(doc: DocumentItem) {
    if (doc.href === "#") {
      setToast(`"${doc.title}" sera disponible au téléchargement prochainement.`);
      setTimeout(() => setToast(""), 4000);
    }
  }

  // Read ?q= parameter on load
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearch(q);
    }
  }, [searchParams]);

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
          d.category.toLowerCase().includes(q),
      );
    }

    return items;
  }, [search, activeCategory]);

  // Group filtered results by category for display
  const grouped = useMemo(() => {
    const map = new Map<Category, DocumentItem[]>();
    for (const doc of filtered) {
      const list = map.get(doc.category) || [];
      list.push(doc);
      map.set(doc.category, list);
    }
    return allCategories
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, docs: map.get(cat)! }));
  }, [filtered]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Search + category filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
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
            placeholder="Rechercher un document..."
            aria-label="Rechercher un document"
            className="w-full rounded-md border border-border-light bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
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
          {allCategories.map((cat) => (
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
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {grouped.length === 0 ? (
        <p className="text-foreground-muted text-sm py-8 text-center">
          Aucun document ne correspond à votre recherche.
        </p>
      ) : (
        <div className="space-y-12">
          {grouped.map(({ category, docs }) => (
            <section key={category}>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                {category}
              </h2>
              <div className="space-y-4">
                {docs.map((doc) => (
                  <article
                    key={doc.title}
                    className="rounded-lg bg-background border-l-[3px] border-l-primary p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        {/* PDF icon */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gaspe-teal-600)]/10 text-[var(--gaspe-teal-600)]">
                          <PdfIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant={categoryVariant(doc.category)}>
                              {doc.category}
                            </Badge>
                            {doc.date && (
                              <time className="text-xs text-foreground-muted">
                                {doc.date}
                              </time>
                            )}
                          </div>
                          <h3 className="font-heading text-lg font-semibold text-foreground">
                            {doc.title}
                          </h3>
                        </div>
                      </div>

                      {/* Download button */}
                      {doc.href !== "#" ? (
                        <a
                          href={doc.href}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-surface-teal transition-colors"
                          download
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Télécharger
                        </a>
                      ) : (
                        <button
                          onClick={() => handleDownload(doc)}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--gaspe-neutral-300)] px-4 py-2.5 text-sm font-medium text-foreground-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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
            <svg className="h-5 w-5 shrink-0 text-[var(--gaspe-teal-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <p>{toast}</p>
            <button onClick={() => setToast("")} className="shrink-0 text-white/50 hover:text-white cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (wraps content in Suspense for useSearchParams)               */
/* ------------------------------------------------------------------ */

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        description="Retrouvez l'ensemble des documents officiels du GASPE : convention collective, accords de branche, publications et notes de position."
        breadcrumbs={[{ label: "Documents" }]}
      />
      <Suspense fallback={null}>
        <DocumentsContent />
      </Suspense>
    </>
  );
}
