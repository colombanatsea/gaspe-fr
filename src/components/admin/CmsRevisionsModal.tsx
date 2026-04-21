"use client";

/**
 * Modal d'historique des révisions CMS pour une page donnée.
 * Branché sur `/api/cms/pages/:pageId/revisions` (list) et
 * `/api/cms/pages/:pageId/revisions/:revisionId/restore` (restore).
 *
 * Ne s'affiche qu'en mode API (production) — en mode localStorage dev,
 * aucune révision n'est conservée.
 */

import { useCallback, useEffect, useState } from "react";
import { apiFetch, isApiMode } from "@/lib/api-client";

export interface CmsRevision {
  id: number;
  pageId: string;
  createdBy: string | null;
  label: string | null;
  createdAt: string;
  sectionsCount: number;
}

interface Props {
  pageId: string;
  open: boolean;
  onClose: () => void;
  /** Appelé après un restore réussi — le parent devrait recharger le contenu. */
  onRestored?: () => void;
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function CmsRevisionsModal({ pageId, open, onClose, onRestored }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!isApiMode()) {
      setRevisions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ revisions?: CmsRevision[] }>(
        `/api/cms/pages/${encodeURIComponent(pageId)}/revisions`,
      );
      setRevisions(res.revisions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  async function handleRestore(revisionId: number) {
    if (
      !confirm(
        "Restaurer cette révision ? L'état actuel sera automatiquement sauvegardé dans l'historique avant d'être remplacé.",
      )
    ) {
      return;
    }
    setRestoringId(revisionId);
    try {
      await apiFetch(
        `/api/cms/pages/${encodeURIComponent(pageId)}/revisions/${revisionId}/restore`,
        { method: "POST" },
      );
      onRestored?.();
      onClose();
    } catch (e) {
      alert(
        `Échec de la restauration : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    } finally {
      setRestoringId(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cms-revisions-title"
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--gaspe-neutral-200)] px-6 py-4">
          <div>
            <h2
              id="cms-revisions-title"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Historique des modifications
            </h2>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Page <code className="rounded bg-[var(--gaspe-neutral-100)] px-1.5 py-0.5">{pageId}</code>{" "}
              · 30 dernières révisions conservées
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-[var(--gaspe-neutral-100)] hover:text-foreground transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isApiMode() ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              L&apos;historique n&apos;est pas disponible en mode local (démo).
              Les révisions sont gérées en production uniquement.
            </p>
          ) : loading ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              Chargement des révisions…
            </p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-600">{error}</p>
          ) : revisions.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              Aucune révision pour cette page.
              <br />
              <span className="text-xs">
                Chaque enregistrement créera automatiquement un nouveau snapshot.
              </span>
            </p>
          ) : (
            <ul className="space-y-2">
              {revisions.map((rev, idx) => {
                const isCurrentPre = idx === 0;
                return (
                  <li
                    key={rev.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm font-semibold text-foreground">
                          {formatTs(rev.createdAt)}
                        </span>
                        {isCurrentPre && (
                          <span className="rounded-full bg-[var(--gaspe-teal-50)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--gaspe-teal-700)]">
                            Avant dernier save
                          </span>
                        )}
                        <span className="text-xs text-foreground-muted">
                          {rev.sectionsCount} section{rev.sectionsCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {rev.label && (
                        <p className="mt-0.5 text-xs italic text-foreground-muted">
                          « {rev.label} »
                        </p>
                      )}
                      {rev.createdBy && (
                        <p className="mt-0.5 text-[11px] text-foreground-muted">
                          par {rev.createdBy}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => void handleRestore(rev.id)}
                      disabled={restoringId !== null}
                      className="ml-4 shrink-0 rounded-lg border border-[var(--gaspe-teal-600)] px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors disabled:opacity-50"
                    >
                      {restoringId === rev.id ? "Restauration…" : "Restaurer"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] px-6 py-3 text-[11px] text-foreground-muted">
          Restaurer une révision crée automatiquement un snapshot de l&apos;état
          actuel → tu peux toujours revenir en arrière.
        </div>
      </div>
    </div>
  );
}
