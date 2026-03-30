"use client";

import { sanitizeHtml } from "@/lib/sanitize-html";

interface ContentPreviewProps {
  html: string;
  title?: string;
}

export function ContentPreview({ html, title }: ContentPreviewProps) {
  return (
    <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--gaspe-neutral-300)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--gaspe-neutral-300)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--gaspe-neutral-300)]" />
        </div>
        <span className="text-xs text-foreground-muted font-medium ml-2">Aperçu</span>
      </div>

      {/* Preview content */}
      <div className="p-6" style={{ background: "var(--color-surface)" }}>
        <div className="mx-auto max-w-3xl rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-8">
          {title && (
            <h1 className="font-heading text-2xl font-bold text-foreground mb-6">{title}</h1>
          )}
          <div
            className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground prose-a:text-[var(--gaspe-teal-600)] prose-h2:text-xl prose-h3:text-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
          />
        </div>
      </div>
    </div>
  );
}
