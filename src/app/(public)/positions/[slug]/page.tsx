import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/shared/SEOJsonLd";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { buildMetadata } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import {
  positions,
  getPositionBySlug,
  type PositionTag,
} from "@/data/positions";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  // Next.js en mode `output: 'export'` exige au moins un paramètre statique
  // pour une route dynamique. Si aucune position n'est publiée, on retourne
  // un slug sentinel qui sera résolu en 404 par `notFound()` ci-dessous.
  if (positions.length === 0) return [{ slug: "__placeholder__" }];
  return positions.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const position = getPositionBySlug(slug);
  if (!position) return { title: "Position introuvable" };

  return buildMetadata({
    title: position.title,
    description: position.excerpt,
    path: `/positions/${position.slug}`,
    ogImage: position.ogImage,
    ogType: "article",
    publishedTime: position.publishedAt,
    keywords: [position.tag, "GASPE", "maritime côtier"],
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

  const canonicalUrl = `${SITE_URL}/positions/${position.slug}`;
  const imageUrl = position.ogImage
    ? `${SITE_URL}${position.ogImage.startsWith("/") ? position.ogImage : `/${position.ogImage}`}`
    : `${SITE_URL}/og-image.png`;

  return (
    <>
      <ArticleJsonLd
        title={position.title}
        description={position.excerpt}
        datePublished={position.publishedAt}
        authorName={position.author ?? "GASPE"}
        imageUrl={imageUrl}
        url={canonicalUrl}
      />

      <BreadcrumbJsonLd
        items={[
          { name: SITE_NAME, url: SITE_URL },
          { name: "Positions", url: `${SITE_URL}/positions` },
          { name: position.title, url: canonicalUrl },
        ]}
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
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge variant={tagVariant(position.tag)}>{position.tag}</Badge>
            <time
              className="text-xs font-medium text-foreground-muted"
              dateTime={position.publishedAt}
            >
              {position.date}
            </time>
          </div>
          <p className="text-base text-foreground-muted leading-relaxed">
            {position.excerpt}
          </p>
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
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(position.body) }}
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
