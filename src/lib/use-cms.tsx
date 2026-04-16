"use client";

import { useMemo } from "react";
import { getPageContent } from "@/lib/cms-store";
import { sanitizeHtml } from "@/lib/sanitize-html";

/**
 * Hook to read CMS page content with fallback to default value.
 * Returns the CMS content if it exists and is non-empty, otherwise the fallback.
 */
export function useCmsContent(pageId: string, sectionId: string, fallback: string = ""): string {
  return useMemo(() => {
    const page = getPageContent(pageId);
    if (page) {
      const section = page.sections.find((s) => s.id === sectionId);
      if (section && section.content.trim()) {
        return section.content;
      }
    }
    return fallback;
  }, [pageId, sectionId, fallback]);
}

/**
 * Hook to read all CMS sections for a page.
 * Returns a map of sectionId → content (only non-empty sections).
 */
export function useCmsPage(pageId: string): Record<string, string> {
  return useMemo(() => {
    const page = getPageContent(pageId);
    if (!page) return {};
    const map: Record<string, string> = {};
    for (const s of page.sections) {
      if (s.content.trim()) {
        map[s.id] = s.content;
      }
    }
    return map;
  }, [pageId]);
}

/**
 * Component that renders CMS HTML content with sanitization.
 * Falls back to children if no CMS content exists.
 */
export function CmsBlock({
  pageId,
  sectionId,
  children,
  className,
}: {
  pageId: string;
  sectionId: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const content = useCmsContent(pageId, sectionId);

  if (content) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  return <div className={className}>{children}</div>;
}
