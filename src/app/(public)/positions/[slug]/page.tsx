import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSITIONS, POSITIONS_SORTED, getPositionBySlug } from "@/data/positions";
import { buildMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/shared/SEOJsonLd";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return POSITIONS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const position = getPositionBySlug(slug);
  if (!position) return { title: "Position introuvable" };

  return buildMetadata({
    title: position.title,
    description: position.excerpt,
    path: `/positions/${position.slug}`,
    keywords: ["position GASPE", position.tag.toLowerCase(), "maritime côtier"],
    ogImage: position.ogImage,
    ogType: "article",
    publishedTime: position.publishedAt,
    modifiedTime: position.updatedAt,
  });
}

function tagVariant(tag: "Position" | "Actualité" | "Presse") {
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

  const url = `${SITE_URL}/positions/${position.slug}`;
  // Articles connexes : 3 autres positions les plus récentes
  const related = POSITIONS_SORTED.filter((p) => p.slug !== position.slug).slice(0, 3);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "GASPE", url: SITE_URL },
          { name: "Positions", url: `${SITE_URL}/positions` },
          { name: position.title, url },
        ]}
      />
      <ArticleJsonLd
        title={position.title}
        description={position.excerpt}
        datePublished={position.publishedAt}
        dateModified={position.updatedAt}
        authorName={position.author ?? "GASPE"}
        imageUrl={position.ogImage ? `${SITE_URL}${position.ogImage}` : `${SITE_URL}/og-image.png`}
        url={url}
      />

      <PageHeader
        title={position.title}
        description={position.excerpt}
        breadcrumbs={[
          { label: "Positions", href: "/positions" },
          { label: position.title },
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-center gap-3">
          <Badge variant={tagVariant(position.tag)}>{position.tag}</Badge>
          <time dateTime={position.publishedAt} className="text-sm text-foreground-muted">
            {position.date}
          </time>
          {position.author && (
            <span className="text-sm text-foreground-muted">
              · Par {position.author}
            </span>
          )}
        </header>

        <div
          className="prose prose-sm max-w-none text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:leading-relaxed [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-2"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(position.body) }}
        />

        <footer className="mt-12 border-t border-border-light pt-6">
          <Link
            href="/positions"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            ← Toutes les positions
          </Link>
        </footer>
      </article>

      {related.length > 0 && (
        <section className="bg-surface border-t border-border-light py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
              À lire également
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/positions/${r.slug}`}
                  className="block rounded-xl bg-background border-l-[3px] border-l-warm p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={tagVariant(r.tag)}>{r.tag}</Badge>
                    <time className="text-xs text-foreground-muted">{r.date}</time>
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground mb-2 line-clamp-2">
                    {r.title}
                  </h3>
                  <p className="text-sm text-foreground-muted line-clamp-2">
                    {r.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
