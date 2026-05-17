"use client";

/**
 * Modal d'historique des snapshots pour une page CMS custom (migration 0045).
 *
 * Parallèle à `CmsRevisionsModal` (pages système) mais simplifié car
 * une page custom = 1 bloc HTML au lieu d'un array de sections. Pas de
 * vue diff multi-sections : preview brut du snapshot + bouton restore.
 *
 * S'ouvre depuis `/admin/pages-custom/edit?slug=X` (bouton Historique).
 * Necessite API mode actif (en localStorage dev, aucun versioning).
 */

import { startTransition, useCallback, useEffect, useState } from "react";
import {
  apiListCustomPageRevisions,
  apiGetCustomPageRevision,
  apiRestoreCustomPageRevision,
  type CustomPageRevisionSummary,
  type CustomPageRevisionDetail,
} from "@/lib/cms-store";
import { isApiMode } from "@/lib/api-client";
import { formatTimestamp } from "@/lib/format-date";
import { useModalA11y } from "@/lib/useModalA11y";

interface Props {
  slug: string;
  open: boolean;
  onClose: () => void;
  /** Appelé après un restore réussi — le parent doit recharger la page. */
  onRestored?: () => void;
}

const formatTs = formatTimestamp;

export function CustomPageRevisionsModal({ slug, open, onClose, onRestored }: Props) {
  const [revisions, setRevisions] = useState<CustomPageRevisionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CustomPageRevisionDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!isApiMode()) {
      setError("L'historique n'est disponible qu'en mode API (production).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await apiListCustomPageRevisions(slug);
      setRevisions(list);
    } catch {
      setError("Erreur lors du chargement de l'historique.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (open) {
      startTransition(() => {
        void refresh();
        setPreview(null);
      });
    }
  }, [open, refresh]);

  const handlePreview = useCallback(
    async (revisionId: number) => {
      setPreviewLoading(true);
      try {
        const detail = await apiGetCustomPageRevision(slug, revisionId);
        setPreview(detail);
      } finally {
        setPreviewLoading(false);
      }
    },
    [slug],
  );

  const handleRestore = useCallback(
    async (revisionId: number) => {
      if (!confirm("Restaurer cette révision ? L'état courant sera également snapshotté pour permettre de revenir en arrière.")) return;
      setRestoring(revisionId);
      try {
        const ok = await apiRestoreCustomPageRevision(slug, revisionId);
        if (ok) {
          onRestored?.();
          onClose();
        } else {
          alert("La restauration a échoué.");
        }
      } finally {
        setRestoring(null);
      }
    },
    [slug, onRestored, onClose],
  );

  const { modalRef } = useModalA11y(open, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-rev-modal-title"
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--gaspe-neutral-200)] px-6 py-4">
          <h2 id="custom-rev-modal-title" className="font-heading text-lg font-bold text-foreground">
            Historique de la page <code className="font-mono text-sm text-[var(--gaspe-teal-700)]">{slug}</code>
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground-muted hover:bg-[var(--gaspe-neutral-100)] hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
          {/* Colonne gauche : liste */}
          <div className="overflow-y-auto border-r border-[var(--gaspe-neutral-200)]">
            {error && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {loading && (
              <p className="p-6 text-center text-sm text-foreground-muted">Chargement…</p>
            )}
            {!loading && !error && revisions.length === 0 && (
              <p className="p-6 text-center text-sm text-foreground-muted">
                Aucun snapshot pour cette page. L&apos;historique se construit à chaque sauvegarde.
              </p>
            )}
            {!loading && revisions.length > 0 && (
              <ul className="divide-y divide-[var(--gaspe-neutral-100)]">
                {revisions.map((r) => (
                  <li
                    key={r.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-[var(--gaspe-neutral-50)] ${preview?.id === r.id ? "bg-[var(--gaspe-teal-50)]" : ""}`}
                    onClick={() => handlePreview(r.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">{r.snapshotLabel}</span>
                      <span className={`text-xs font-medium ${r.snapshotPublished ? "text-green-600" : "text-foreground-muted"}`}>
                        {r.snapshotPublished ? "Publiée" : "Brouillon"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
                      <span>{formatTs(r.createdAt)}</span>
                      {r.createdByEmail && <span className="truncate max-w-[200px]">par {r.createdByEmail}</span>}
                    </div>
                    {r.label && (
                      <p className="mt-1 italic text-xs text-foreground-muted">Motif : {r.label}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Colonne droite : aperçu */}
          <div className="overflow-y-auto bg-[var(--gaspe-neutral-50)]">
            {previewLoading && (
              <p className="p-6 text-center text-sm text-foreground-muted">Chargement de l&apos;aperçu…</p>
            )}
            {!previewLoading && !preview && (
              <p className="p-6 text-center text-sm text-foreground-muted">
                Sélectionnez une révision dans la liste pour la prévisualiser.
              </p>
            )}
            {!previewLoading && preview && (
              <div className="space-y-4 p-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Titre</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{preview.snapshotLabel}</div>
                </div>
                {preview.snapshotDescription && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Description</div>
                    <div className="mt-1 text-sm text-foreground-muted">{preview.snapshotDescription}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Contenu</div>
                  <div
                    className="mt-1 rounded-lg bg-white border border-[var(--gaspe-neutral-200)] p-4 text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: preview.snapshotContent || "<em class='text-foreground-muted'>(vide)</em>" }}
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--gaspe-neutral-200)]">
                  <button
                    onClick={() => setPreview(null)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted hover:text-foreground"
                  >
                    Fermer l&apos;aperçu
                  </button>
                  <button
                    onClick={() => handleRestore(preview.id)}
                    disabled={restoring === preview.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--gaspe-teal-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] disabled:opacity-50"
                  >
                    {restoring === preview.id ? "Restauration…" : "Restaurer cette révision"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
