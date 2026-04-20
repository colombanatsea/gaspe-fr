"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { Badge } from "@/components/ui/Badge";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { POSITIONS_SORTED, type PositionTag } from "@/data/positions";

const PAGE_ID = "positions";
const D = (s: string) => getCmsDefault(PAGE_ID, s);

type Tag = PositionTag;

const positions = POSITIONS_SORTED;

const allTags: Tag[] = ["Position", "Actualité", "Presse"];

const INITIAL_VISIBLE = 6;

/* ------------------------------------------------------------------ */
/*  Badge variant helper                                               */
/* ------------------------------------------------------------------ */

function tagVariant(tag: Tag) {
  switch (tag) {
    case "Position":
      return "teal" as const;
    case "Actualité":
      return "blue" as const;
    case "Presse":
      return "warm" as const;
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PositionsPage() {
  const revealRef = useScrollReveal();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    let items = [...positions].sort((a, b) =>
      b.sortKey.localeCompare(a.sortKey),
    );

    if (activeTag) {
      items = items.filter((p) => p.tag === activeTag);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q),
      );
    }

    return items;
  }, [search, activeTag]);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);

  const searchPlaceholder = useCmsContent(PAGE_ID, "search-placeholder", D("search-placeholder"));
  const positionsSectionTitle = useCmsContent(PAGE_ID, "positions-section-title", D("positions-section-title"));
  const presseSectionTitle = useCmsContent(PAGE_ID, "presse-section-title", D("presse-section-title"));
  const presseDescription = useCmsContent(PAGE_ID, "presse-description", D("presse-description"));

  return (
    <>
      <CmsPageHeader
        pageId="positions"
        defaultTitle="Positions"
        defaultDescription="Les positions du GASPE sur les grands enjeux du transport maritime de service public."
        breadcrumbs={[{ label: "Positions" }]}
      />

      <div ref={revealRef} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* -------------------------------------------------------- */}
        {/*  Section 1 — Positions du GASPE                          */}
        {/* -------------------------------------------------------- */}
        <section className="reveal">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
            {positionsSectionTitle}
          </h2>

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 rounded-xl border border-border-light bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveTag(null)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activeTag === null
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground-muted hover:bg-surface-teal"
                }`}
              >
                Tous
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setActiveTag(activeTag === tag ? null : tag)
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    activeTag === tag
                      ? "bg-primary text-white"
                      : "bg-surface text-foreground-muted hover:bg-surface-teal"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          {visible.length === 0 ? (
            <p className="text-foreground-muted text-sm py-8 text-center">
              Aucun résultat pour votre recherche.
            </p>
          ) : (
            <div className="space-y-4">
              {visible.map((position) => (
                <Link
                  key={position.slug}
                  href={`/positions/${position.slug}`}
                  className="block rounded-xl bg-background border-l-[3px] border-l-warm p-6 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={tagVariant(position.tag)}>
                        {position.tag}
                      </Badge>
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {position.title}
                      </h3>
                    </div>
                    <time className="shrink-0 text-xs text-foreground-muted">
                      {position.date}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-foreground-muted line-clamp-2">
                    {position.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* "Voir plus" button */}
          {!showAll && filtered.length > INITIAL_VISIBLE && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
              >
                Voir plus
              </button>
            </div>
          )}
        </section>

        {/* -------------------------------------------------------- */}
        {/*  Section 2 — Espace Presse                               */}
        {/* -------------------------------------------------------- */}
        <section className="mt-16 reveal">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
            {presseSectionTitle}
          </h2>

          {presseDescription && presseDescription !== D("presse-description") && (
            <div
              className="mb-6 text-sm text-foreground-muted prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(presseDescription) }}
            />
          )}

          <div className="rounded-2xl bg-background border border-border-light p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Logo / identity block */}
              <div className="shrink-0 flex items-start justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl gaspe-gradient">
                  <span className="font-heading text-3xl font-bold text-white">
                    G
                  </span>
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1">
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                  GASPE
                </h3>
                <p className="text-sm text-foreground-muted leading-relaxed mb-4">
                  Le GASPE — Groupement des Armateurs de Services Publics
                  Maritimes de Passages d&apos;Eau — regroupe 21 armateurs
                  titulaires et 10 membres associés assurant les liaisons
                  maritimes de service public en France métropolitaine et
                  outre-mer. 1&nbsp;364 collaborateurs, 111 navires.
                </p>

                <p className="text-sm text-foreground-muted mb-6">
                  <strong className="text-foreground">Contact presse :</strong>{" "}
                  <a
                    href="mailto:contact@gaspe.fr"
                    className="text-primary hover:text-primary-hover font-medium transition-colors"
                  >
                    contact@gaspe.fr
                  </a>
                </p>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                    Télécharger le kit presse
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-xl border border-primary text-primary px-5 py-2.5 text-sm font-medium hover:bg-surface-teal transition-colors"
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
                    Télécharger le logo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
