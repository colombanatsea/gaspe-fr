"use client";

/**
 * Route publique pour les pages custom CMS (Phase 3 hybride). Pattern
 * query-string `/p?slug=X` plutôt que segment dynamique `/p/[slug]`
 * pour rester compatible avec `output: 'export'` de Next.js (les
 * segments dynamiques sans `generateStaticParams` ne sont pas
 * supportés en static export).
 *
 * La page rend le HTML stocké via `dangerouslySetInnerHTML` après un
 * passage dans `sanitizeHtml` côté client — le HTML est déjà filtré
 * côté admin via le RichTextEditor + validé côté Worker à l'écriture,
 * mais on défense-en-profondeur ici.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { BreadcrumbJsonLd } from "@/components/shared/SEOJsonLd";
import { ScrollRevealWrapper } from "@/components/shared/ScrollRevealWrapper";
import { apiGetCustomPage, type CmsCustomPage } from "@/lib/cms-store";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

function CustomPageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const [page, setPage] = useState<CmsCustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Aucun slug fourni dans l'URL (?slug=…).");
      setLoading(false);
      return;
    }
    apiGetCustomPage(slug)
      .then((p) => {
        if (!p) setError("Page introuvable.");
        setPage(p);
      })
      .catch(() => setError("Erreur lors du chargement."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <p className="py-16 text-center text-sm text-foreground-muted">Chargement…</p>;
  }

  if (error || !page) {
    return (
      <>
        <PageHeader
          title="Page introuvable"
          description={error ?? "Cette page n'existe pas ou n'est pas publiée."}
          breadcrumbs={[{ label: "Page introuvable" }]}
        />
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
        </section>
      </>
    );
  }

  const canonicalUrl = `${SITE_URL}/p?slug=${encodeURIComponent(page.slug)}`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: SITE_NAME, url: SITE_URL },
          { name: page.label, url: canonicalUrl },
        ]}
      />
      <PageHeader
        title={page.label}
        description={page.description || undefined}
        breadcrumbs={[{ label: page.label }]}
      />

      <ScrollRevealWrapper className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <article
          className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground prose-a:text-[var(--gaspe-teal-600)] max-w-none reveal"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
        />
      </ScrollRevealWrapper>
    </>
  );
}

export default function CustomPagePublic() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-sm text-foreground-muted">Chargement…</p>}>
      <CustomPageContent />
    </Suspense>
  );
}
