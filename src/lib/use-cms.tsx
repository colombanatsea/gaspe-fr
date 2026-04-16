"use client";

import { useState, useEffect } from "react";
import { getPageContent, apiGetPageContent, type PageSection } from "@/lib/cms-store";
import { isApiMode } from "@/lib/api-client";
import { sanitizeHtml } from "@/lib/sanitize-html";

/**
 * Hook to read CMS page content with fallback to default value.
 * Returns the CMS content if it exists and is non-empty, otherwise the fallback.
 * Supports both localStorage (demo) and API (production) modes.
 */
export function useCmsContent(pageId: string, sectionId: string, fallback: string = ""): string {
  const [content, setContent] = useState(fallback);

  useEffect(() => {
    if (isApiMode()) {
      apiGetPageContent(pageId).then((page) => {
        if (page) {
          const section = page.sections.find((s) => s.id === sectionId);
          if (section && section.content.trim()) {
            setContent(section.content);
          }
        }
      });
    } else {
      const page = getPageContent(pageId);
      if (page) {
        const section = page.sections.find((s) => s.id === sectionId);
        if (section && section.content.trim()) {
          setContent(section.content);
        }
      }
    }
  }, [pageId, sectionId]);

  return content;
}

/**
 * Hook to read all CMS sections for a page.
 * Returns a map of sectionId → content (only non-empty sections).
 */
export function useCmsPage(pageId: string): Record<string, string> {
  const [sections, setSections] = useState<Record<string, string>>({});

  useEffect(() => {
    function processPage(page: { sections: PageSection[] } | null) {
      if (page) {
        const map: Record<string, string> = {};
        for (const s of page.sections) {
          if (s.content.trim()) {
            map[s.id] = s.content;
          }
        }
        setSections(map);
      }
    }

    if (isApiMode()) {
      apiGetPageContent(pageId).then(processPage);
    } else {
      processPage(getPageContent(pageId));
    }
  }, [pageId]);

  return sections;
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
