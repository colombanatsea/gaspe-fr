"use client";

import { PageHeader } from "./PageHeader";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";

interface CmsPageHeaderProps {
  pageId: string;
  defaultTitle: string;
  defaultDescription?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

/**
 * Page header wired to the CMS.
 * Uses `{pageId}.page-header-title` and `{pageId}.page-header-description` with defaults as fallback.
 * Breadcrumbs stay in code (structural, not content).
 */
export function CmsPageHeader({ pageId, defaultTitle, defaultDescription, breadcrumbs }: CmsPageHeaderProps) {
  const fallbackTitle = getCmsDefault(pageId, "page-header-title") || defaultTitle;
  const fallbackDescription = getCmsDefault(pageId, "page-header-description") || defaultDescription || "";

  const title = useCmsContent(pageId, "page-header-title", fallbackTitle);
  const description = useCmsContent(pageId, "page-header-description", fallbackDescription);

  return (
    <PageHeader
      title={title}
      description={description || undefined}
      breadcrumbs={breadcrumbs}
    />
  );
}
