"use client";

/**
 * Modal d'historique des révisions CMS pour une page donnée.
 * Branché sur `/api/cms/pages/:pageId/revisions` (list),
 * `/api/cms/pages/:pageId/revisions/:revisionId/restore` (restore) et
 * `/api/cms/pages/:pageId/revisions/:revisionId` (diff).
 *
 * Ne s'affiche qu'en mode API (production) — en mode localStorage dev,
 * aucune révision n'est conservée.
 *
 * Session 33 : filtres auteur + plage de dates, sélection pour comparaison
 * (diff 3 colonnes), affichage de l'email de l'auteur.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, isApiMode } from "@/lib/api-client";
import { CmsRevisionDiff, type CmsRevisionDetail } from "./CmsRevisionDiff";

export interface CmsRevision {
  id: number;
  pageId: string;
  createdBy: string | null;
  createdByEmail: string | null;
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

/** Convertit "YYYY-MM-DD" en timestamp inclusif au début/fin de journée. */
function boundDate(dateStr: string, endOfDay: boolean): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + (endOfDay ? "T23:59:59.999Z" : "T00:00:00Z"));
  return isNaN(d.getTime()) ? null : d.getTime();
}

function parseRevisionTs(iso: string): number {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.getTime();
}

export function CmsRevisionsModal({ pageId, open, onClose, onRestored }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  // Filtres
  const [authorFilter, setAuthorFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Mode comparaison (sélection de 2 révisions)
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [diffRevisions, setDiffRevisions] = useState<
    [CmsRevisionDetail, CmsRevisionDetail] | null
  >(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

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
    if (open) {
      void refresh();
      // reset des états locaux à chaque ouverture
      setAuthorFilter("");
      setFromDate("");
      setToDate("");
      setCompareMode(false);
      setSelectedIds([]);
      setDiffRevisions(null);
    }
  }, [open, refresh]);

  // Liste unique des auteurs pour le select (afficher email si dispo, sinon id)
  const authors = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of revisions) {
      if (!r.createdBy) continue;
      const label = r.createdByEmail ?? r.createdBy;
      if (!map.has(r.createdBy)) map.set(r.createdBy, label);
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [revisions]);

  // Filtrage côté client (les filtres restent éphémères — pas de persistance)
  const filteredRevisions = useMemo(() => {
    const fromTs = boundDate(fromDate, false);
    const toTs = boundDate(toDate, true);
    return revisions.filter((r) => {
      if (authorFilter && r.createdBy !== authorFilter) return false;
      const ts = parseRevisionTs(r.createdAt);
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });
  }, [revisions, authorFilter, fromDate, toDate]);

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

  function toggleSelection(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // FIFO : remplace le plus ancien
      return [...prev, id];
    });
  }

  async function handleCompare() {
    if (selectedIds.length !== 2) return;
    setLoadingDiff(true);
    try {
      const [a, b] = selectedIds;
      const [resA, resB] = await Promise.all([
        apiFetch<{ revision: CmsRevisionDetail }>(
          `/api/cms/pages/${encodeURIComponent(pageId)}/revisions/${a}`,
        ),
        apiFetch<{ revision: CmsRevisionDetail }>(
          `/api/cms/pages/${encodeURIComponent(pageId)}/revisions/${b}`,
        ),
      ]);
      // On ordonne toujours par date (plus ancien → plus récent) pour la lisibilité
      const tsA = parseRevisionTs(resA.revision.createdAt);
      const tsB = parseRevisionTs(resB.revision.createdAt);
      const ordered: [CmsRevisionDetail, CmsRevisionDetail] =
        tsA <= tsB ? [resA.revision, resB.revision] : [resB.revision, resA.revision];
      setDiffRevisions(ordered);
    } catch (e) {
      alert(`Échec du chargement du diff : ${e instanceof Error ? e.message : "erreur"}`);
    } finally {
      setLoadingDiff(false);
    }
  }

  if (!open) return null;

  const hasFilters = authorFilter || fromDate || toDate;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cms-revisions-title"
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
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

        {/* Filters bar */}
        {isApiMode() && revisions.length > 0 && (
          <div className="border-b border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] px-6 py-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-foreground-muted">
                <span>Auteur</span>
                <select
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="min-w-[180px] rounded-lg border border-[var(--gaspe-neutral-200)] bg-white px-2 py-1.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]"
                >
                  <option value="">Tous les auteurs</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-foreground-muted">
                <span>Du</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-lg border border-[var(--gaspe-neutral-200)] bg-white px-2 py-1.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-foreground-muted">
                <span>Au</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-[var(--gaspe-neutral-200)] bg-white px-2 py-1.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]"
                />
              </label>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthorFilter("");
                    setFromDate("");
                    setToDate("");
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground underline"
                >
                  Réinitialiser
                </button>
              )}

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCompareMode((prev) => !prev);
                    setSelectedIds([]);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    compareMode
                      ? "bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-700)] border border-[var(--gaspe-teal-200)]"
                      : "border border-[var(--gaspe-neutral-200)] text-foreground-muted hover:text-foreground"
                  }`}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                    />
                  </svg>
                  {compareMode ? "Annuler la comparaison" : "Comparer 2 révisions"}
                </button>
                {compareMode && selectedIds.length === 2 && (
                  <button
                    type="button"
                    onClick={() => void handleCompare()}
                    disabled={loadingDiff}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                  >
                    {loadingDiff ? "Chargement…" : "Voir le diff"}
                  </button>
                )}
              </div>
            </div>
            {compareMode && (
              <p className="mt-2 text-[11px] italic text-foreground-muted">
                Coche 2 révisions à comparer ({selectedIds.length}/2 sélectionnée
                {selectedIds.length > 1 ? "s" : ""}).
              </p>
            )}
          </div>
        )}

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
          ) : filteredRevisions.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              Aucune révision ne correspond aux filtres.
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredRevisions.map((rev, idx) => {
                // idx 0 = snapshot le plus récent dans la liste FILTRÉE
                const isMostRecent = idx === 0 && !hasFilters;
                const isSelected = selectedIds.includes(rev.id);
                const authorLabel = rev.createdByEmail ?? rev.createdBy;
                return (
                  <li
                    key={rev.id}
                    className={`flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm transition-colors ${
                      isSelected
                        ? "border-[var(--gaspe-teal-400)] ring-2 ring-[var(--gaspe-teal-100)]"
                        : "border-[var(--gaspe-neutral-200)]"
                    }`}
                  >
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(rev.id)}
                        className="mr-3 h-4 w-4 shrink-0 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)] focus:ring-[var(--gaspe-teal-400)]"
                        aria-label={`Sélectionner la révision du ${formatTs(rev.createdAt)}`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm font-semibold text-foreground">
                          {formatTs(rev.createdAt)}
                        </span>
                        {isMostRecent && (
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
                      {authorLabel && (
                        <p className="mt-0.5 text-[11px] text-foreground-muted">
                          par {authorLabel}
                        </p>
                      )}
                    </div>
                    {!compareMode && (
                      <button
                        onClick={() => void handleRestore(rev.id)}
                        disabled={restoringId !== null}
                        className="ml-4 shrink-0 rounded-lg border border-[var(--gaspe-teal-600)] px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors disabled:opacity-50"
                      >
                        {restoringId === rev.id ? "Restauration…" : "Restaurer"}
                      </button>
                    )}
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

      {/* Diff modal — surcouche au-dessus de celle-ci */}
      {diffRevisions && (
        <CmsRevisionDiff
          pageId={pageId}
          before={diffRevisions[0]}
          after={diffRevisions[1]}
          onClose={() => setDiffRevisions(null)}
        />
      )}
    </div>
  );
}
