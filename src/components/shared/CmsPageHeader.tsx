"use client";

import { PageHeader } from "./PageHeader";
import { BreadcrumbJsonLd } from "./SEOJsonLd";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

interface CmsPageHeaderProps {
  pageId: string;
  defaultTitle: string;
  defaultDescription?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

/**
 * Page header wired to the CMS + BreadcrumbList JSON-LD automatique.
 * Uses `{pageId}.page-header-title` and `{pageId}.page-header-description` with defaults as fallback.
 */
export function CmsPageHeader({ pageId, defaultTitle, defaultDescription, breadcrumbs }: CmsPageHeaderProps) {
  const fallbackTitle = getCmsDefault(pageId, "page-header-title") || defaultTitle;
  const fallbackDescription = getCmsDefault(pageId, "page-header-description") || defaultDescription || "";

  const title = useCmsContent(pageId, "page-header-title", fallbackTitle);
  const description = useCmsContent(pageId, "page-header-description", fallbackDescription);

  // JSON-LD BreadcrumbList : toujours inclut l'accueil + pages intermédiaires + page courante.
  const breadcrumbItems = [
    { name: SITE_NAME, url: SITE_URL },
    ...(breadcrumbs ?? []).map((b) => ({
      name: b.label,
      url: b.href ? `${SITE_URL}${b.href.startsWith("/") ? b.href : `/${b.href}`}` : SITE_URL,
    })),
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <PageHeader
        title={title}
        description={description || undefined}
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
