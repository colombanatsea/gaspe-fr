"use client";

import { useEffect } from "react";

interface PdfViewerModalProps {
  url: string;
  title: string;
  /** Si false, le bouton Télécharger est caché (ex: documents privés en preview). */
  downloadable?: boolean;
  /** Nom du fichier suggéré au download. Si absent, le navigateur déduit depuis l'URL. */
  downloadFileName?: string;
  onClose: () => void;
}

// Viewer PDF native iframe. Les navigateurs modernes (Chrome/Edge/Firefox/Safari
// desktop) embarquent un viewer PDF complet avec toolbar (zoom, page, print,
// download). Pour iOS Safari mobile, le viewer est plus limité — on garde le
// bouton « Télécharger » du header en fallback.
export function PdfViewerModal({ url, title, downloadable = true, downloadFileName, onClose }: PdfViewerModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-viewer-title"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[var(--gaspe-neutral-200)] px-4 py-3">
          <h2 id="pdf-viewer-title" className="font-heading text-sm font-semibold text-foreground truncate">
            {title}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {downloadable && (
              <a
                href={url}
                download={downloadFileName}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-surface-teal transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Télécharger
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le visualiseur"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:bg-[var(--gaspe-neutral-100)] hover:text-foreground transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <iframe
          src={url}
          title={title}
          className="flex-1 w-full bg-[var(--gaspe-neutral-100)]"
        />
      </div>
    </div>
  );
}
