"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { Badge } from "@/components/ui/Badge";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";
import { sanitizeHtml } from "@/lib/sanitize-html";
import {
  publishedPositions,
  type PositionItem,
  type PositionTag,
} from "@/data/positions";
import { memberStats } from "@/data/members";

const PAGE_ID = "positions";
const D = (s: string) => getCmsDefault(PAGE_ID, s);

const allTags: PositionTag[] = ["Position", "Actualité", "Presse"];
const INITIAL_VISIBLE = 6;

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

export default function PositionsPage() {
  const revealRef = useScrollReveal();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<PositionTag | null>(null);
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo<PositionItem[]>(() => {
    let items = [...publishedPositions];

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
        <section className="reveal">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {positionsSectionTitle}
            </h2>
            <Link
              href="/feed.xml"
              className="inline-flex items-center gap-2 rounded-xl border border-primary text-primary px-4 py-2 text-xs font-semibold hover:bg-surface-teal transition-colors"
              aria-label="Flux RSS des positions GASPE"
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

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 rounded-xl border border-border-light bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Rechercher une position"
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
                  <article>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={tagVariant(position.tag)}>
                          {position.tag}
                        </Badge>
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          {position.title}
                        </h3>
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
          )}

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
              <div className="shrink-0 flex items-start justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl gaspe-gradient">
                  <span className="font-heading text-3xl font-bold text-white">
                    G
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                  GASPE
                </h3>
                <p className="text-sm text-foreground-muted leading-relaxed mb-4">
                  Le GASPE – Groupement des Armateurs de Services Publics
                  Maritimes de Passages d&apos;Eau – fédère{" "}
                  {memberStats.compagnies} compagnies maritimes côtières
                  françaises assurant les liaisons de service public sur
                  l&apos;hexagone et en outre-mer. 1&nbsp;494 marins français,{" "}
                  {memberStats.totalShips} navires, 25 M+ de passagers par an.
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
