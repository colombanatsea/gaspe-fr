"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";

const D = (s: string) => getCmsDefault("homepage", s);

const NEWS_ICONS: Record<string, React.ReactElement> = {
  sun: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  ),
  users: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  ),
  map: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  ),
  document: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  ship: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15" />
    </svg>
  ),
};

const COLOR_MAP: Record<string, { color: string; bgColor: string }> = {
  teal: { color: "var(--gaspe-teal-600)", bgColor: "var(--gaspe-teal-50)" },
  green: { color: "var(--gaspe-green-500)", bgColor: "var(--gaspe-green-50)" },
  blue: { color: "var(--gaspe-blue-600)", bgColor: "var(--gaspe-blue-50)" },
  warm: { color: "var(--gaspe-warm-500)", bgColor: "var(--gaspe-warm-50)" },
};

interface NewsItem {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  iconKey: string;
  colorKey: string;
}

function parseList<T>(json: string): T[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function LatestNews() {
  const containerRef = useScrollReveal();

  const eyebrow = useCmsContent("homepage", "news-eyebrow", D("news-eyebrow"));
  const title = useCmsContent("homepage", "news-title", D("news-title"));
  const description = useCmsContent("homepage", "news-description", D("news-description"));
  const itemsJson = useCmsContent("homepage", "news-items", D("news-items"));
  const items = parseList<NewsItem>(itemsJson);

  return (
    <section ref={containerRef} className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal flex items-end justify-between mb-12">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-600)] mb-3">
              {eyebrow}
            </p>
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-2 text-foreground-muted max-w-lg">
              {description}
            </p>
          </div>
          <Link
            href="/positions"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] transition-colors"
          >
            Toutes nos positions
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item, i) => {
            const palette = COLOR_MAP[item.colorKey] ?? COLOR_MAP.teal;
            const icon = NEWS_ICONS[item.iconKey] ?? NEWS_ICONS.document;
            return (
              <article
                key={`${item.title}-${i}`}
                className={`reveal-scale stagger-${i + 1} group relative rounded-2xl bg-white p-8 gaspe-card-hover border border-[var(--gaspe-neutral-200)] hover:border-[var(--gaspe-teal-200)] overflow-hidden`}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
                  style={{ background: `linear-gradient(90deg, ${palette.color}, transparent)` }}
                />

                <div className="flex items-start justify-between mb-5">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300"
                    style={{ backgroundColor: palette.bgColor, color: palette.color }}
                  >
                    {icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="teal">{item.category}</Badge>
                  </div>
                </div>

                <h3 className="font-heading text-lg font-semibold text-foreground mb-3 group-hover:text-[var(--gaspe-teal-600)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-foreground-muted leading-relaxed mb-4">
                  {item.excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--gaspe-neutral-100)]">
                  <span className="text-xs text-foreground-muted">{item.date}</span>
                  <span className="text-xs font-medium text-[var(--gaspe-teal-600)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Lire
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/positions"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] transition-colors"
          >
            Toutes nos positions
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
