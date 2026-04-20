import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { ArticleJsonLd } from "@/components/shared/SEOJsonLd";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { buildMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import { getPositionBySlug, getSortedPositions, positions, type PositionTag } from "@/data/positions";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return positions.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const position = getPositionBySlug(slug);
  if (!position) return { title: "Position introuvable" };

  return buildMetadata({
    title: position.title,
    description: position.excerpt,
    path: `/positions/${position.slug}`,
    keywords: [
      "position GASPE",
      "maritime côtier tribune",
      position.tag.toLowerCase(),
      ...position.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4),
    ],
    ogType: "article",
    publishedTime: position.datePublished,
    modifiedTime: position.dateModified ?? position.datePublished,
    ogImage: position.imageUrl,
  });
}

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

export default async function PositionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const position = getPositionBySlug(slug);

  if (!position) notFound();

  // Articles liés : 3 autres positions les plus récentes
  const related = getSortedPositions()
    .filter((p) => p.slug !== position.slug)
    .slice(0, 3);

  return (
    <>
      <CmsPageHeader
        pageId="positions"
        defaultTitle={position.title}
        defaultDescription={position.excerpt}
        breadcrumbs={[
          { label: "Positions", href: "/positions" },
          { label: position.title },
        ]}
      />

      <ArticleJsonLd
        title={position.title}
        description={position.excerpt}
        datePublished={position.datePublished}
        dateModified={position.dateModified}
        authorName={position.author ?? "GASPE"}
        imageUrl={position.imageUrl}
        url={`${SITE_URL}/positions/${position.slug}`}
      />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge variant={tagVariant(position.tag)}>{position.tag}</Badge>
          <time
            dateTime={position.datePublished}
            className="text-sm text-foreground-muted"
          >
            {position.date}
          </time>
          {position.author && (
            <span className="text-sm text-foreground-muted">
              par <strong className="text-foreground">{position.author}</strong>
            </span>
          )}
        </div>

        <p className="mb-8 text-lg leading-relaxed text-foreground-muted">
          {position.excerpt}
        </p>

        <div
          className="prose prose-sm sm:prose max-w-none prose-headings:font-heading prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary-hover prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(position.body) }}
        />

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border-light pt-8">
          <Link
            href="/positions"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            &larr; Toutes les positions
          </Link>
          <a
            href={`mailto:contact@gaspe.fr?subject=${encodeURIComponent(
              `À propos de votre position : ${position.title}`,
            )}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            Contacter le GASPE
          </a>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              À lire aussi
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/positions/${r.slug}`}
                  className="block rounded-xl bg-background border border-border-light p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={tagVariant(r.tag)}>{r.tag}</Badge>
                    <time
                      dateTime={r.datePublished}
                      className="text-xs text-foreground-muted"
                    >
                      {r.date}
                    </time>
                  </div>
                  <h3 className="font-heading text-sm font-semibold text-foreground line-clamp-2">
                    {r.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
