"use client";

/**
 * Vue diff entre deux révisions CMS.
 *
 * Affichage en 3 colonnes :
 *  - Avant  : sections de la révision la plus ancienne
 *  - Après  : sections de la révision la plus récente
 *  - Diff   : liste synthétique des sections ajoutées / supprimées / modifiées
 *
 * Les sections sont appariées par leur `id`. Le contenu HTML (richtext) est
 * échappé pour l'affichage afin d'éviter toute interprétation dans le modal.
 */

import { useMemo } from "react";

export interface CmsRevisionDetailSection {
  id: string;
  label: string;
  type: string;
  content: string;
}

export interface CmsRevisionDetail {
  id: number;
  pageId: string;
  createdBy: string | null;
  createdByEmail: string | null;
  label: string | null;
  createdAt: string;
  sections: CmsRevisionDetailSection[];
}

interface Props {
  pageId: string;
  before: CmsRevisionDetail;
  after: CmsRevisionDetail;
  onClose: () => void;
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

/** Préview courte du contenu d'une section (max ~200 car, HTML strippé). */
function previewContent(content: string, max = 240): string {
  if (!content) return "(vide)";
  const plain = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "(vide)";
  return plain.length > max ? plain.slice(0, max) + "…" : plain;
}

type ChangeKind = "added" | "removed" | "modified" | "unchanged";

interface SectionChange {
  id: string;
  label: string;
  type: string;
  kind: ChangeKind;
  beforeContent: string | null;
  afterContent: string | null;
}

function diffSections(
  before: CmsRevisionDetailSection[],
  after: CmsRevisionDetailSection[],
): SectionChange[] {
  const beforeMap = new Map(before.map((s) => [s.id, s]));
  const afterMap = new Map(after.map((s) => [s.id, s]));
  const allIds = new Set<string>([...beforeMap.keys(), ...afterMap.keys()]);

  const changes: SectionChange[] = [];
  for (const id of allIds) {
    const b = beforeMap.get(id);
    const a = afterMap.get(id);
    if (b && !a) {
      changes.push({
        id,
        label: b.label,
        type: b.type,
        kind: "removed",
        beforeContent: b.content,
        afterContent: null,
      });
    } else if (!b && a) {
      changes.push({
        id,
        label: a.label,
        type: a.type,
        kind: "added",
        beforeContent: null,
        afterContent: a.content,
      });
    } else if (b && a) {
      changes.push({
        id,
        label: a.label || b.label,
        type: a.type,
        kind: b.content === a.content ? "unchanged" : "modified",
        beforeContent: b.content,
        afterContent: a.content,
      });
    }
  }
  // Ordre : changements d'abord, puis inchangés ; alphabétique par id au sein du groupe.
  const order: Record<ChangeKind, number> = {
    modified: 0,
    added: 1,
    removed: 2,
    unchanged: 3,
  };
  changes.sort((x, y) => {
    const d = order[x.kind] - order[y.kind];
    return d !== 0 ? d : x.id.localeCompare(y.id);
  });
  return changes;
}

function kindBadge(kind: ChangeKind): { label: string; classes: string } {
  switch (kind) {
    case "added":
      return {
        label: "Ajoutée",
        classes: "bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-700)]",
      };
    case "removed":
      return { label: "Supprimée", classes: "bg-red-50 text-red-700" };
    case "modified":
      return {
        label: "Modifiée",
        classes: "bg-[var(--gaspe-warm-50)] text-[var(--gaspe-warm-700)]",
      };
    case "unchanged":
    default:
      return { label: "Inchangée", classes: "bg-[var(--gaspe-neutral-100)] text-foreground-muted" };
  }
}

export function CmsRevisionDiff({ pageId, before, after, onClose }: Props) {
  const changes = useMemo(() => diffSections(before.sections, after.sections), [
    before.sections,
    after.sections,
  ]);

  const diffs = changes.filter((c) => c.kind !== "unchanged");
  const unchangedCount = changes.length - diffs.length;

  const authorBefore = before.createdByEmail ?? before.createdBy ?? "—";
  const authorAfter = after.createdByEmail ?? after.createdBy ?? "—";

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cms-diff-title"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--gaspe-neutral-200)] px-6 py-4">
          <div>
            <h2
              id="cms-diff-title"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Comparaison de 2 révisions
            </h2>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Page{" "}
              <code className="rounded bg-[var(--gaspe-neutral-100)] px-1.5 py-0.5">
                {pageId}
              </code>{" "}
              · {diffs.length} section{diffs.length !== 1 ? "s" : ""} modifiée
              {diffs.length !== 1 ? "s" : ""} sur {changes.length}
              {unchangedCount > 0 && (
                <span className="text-foreground-muted"> ({unchangedCount} inchangée{unchangedCount !== 1 ? "s" : ""})</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer le diff"
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-[var(--gaspe-neutral-100)] hover:text-foreground transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Méta-infos 3 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] px-6 py-3 text-xs">
          <div>
            <p className="font-heading font-semibold uppercase tracking-wider text-foreground-muted">
              Avant (#{before.id})
            </p>
            <p className="mt-0.5 text-foreground">{formatTs(before.createdAt)}</p>
            <p className="text-foreground-muted">par {authorBefore}</p>
            {before.label && (
              <p className="mt-0.5 italic text-foreground-muted">« {before.label} »</p>
            )}
          </div>
          <div>
            <p className="font-heading font-semibold uppercase tracking-wider text-foreground-muted">
              Après (#{after.id})
            </p>
            <p className="mt-0.5 text-foreground">{formatTs(after.createdAt)}</p>
            <p className="text-foreground-muted">par {authorAfter}</p>
            {after.label && (
              <p className="mt-0.5 italic text-foreground-muted">« {after.label} »</p>
            )}
          </div>
          <div>
            <p className="font-heading font-semibold uppercase tracking-wider text-foreground-muted">
              Différences
            </p>
            <p className="mt-0.5 text-foreground">
              {diffs.length} changement{diffs.length !== 1 ? "s" : ""}
            </p>
            <p className="text-foreground-muted">
              {diffs.filter((c) => c.kind === "modified").length} modif.,{" "}
              {diffs.filter((c) => c.kind === "added").length} ajout
              {diffs.filter((c) => c.kind === "added").length !== 1 ? "s" : ""},{" "}
              {diffs.filter((c) => c.kind === "removed").length} suppr.
            </p>
          </div>
        </div>

        {/* Body : liste des sections diff, 3 colonnes par ligne */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {diffs.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              Les 2 révisions sont identiques — aucune différence détectée.
            </p>
          ) : (
            <ul className="space-y-3">
              {diffs.map((c) => {
                const badge = kindBadge(c.kind);
                return (
                  <li
                    key={c.id}
                    className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                      <span className="font-heading text-sm font-semibold text-foreground">
                        {c.label}
                      </span>
                      <code className="rounded bg-[var(--gaspe-neutral-100)] px-1.5 py-0.5 text-[11px] text-foreground-muted">
                        {c.id}
                      </code>
                      <span className="ml-auto rounded-full bg-[var(--gaspe-neutral-200)] px-2 py-0.5 text-[10px] font-medium text-foreground-muted uppercase">
                        {c.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div
                        className={`rounded-lg border p-3 text-xs leading-relaxed ${
                          c.kind === "added"
                            ? "border-dashed border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] text-foreground-muted italic"
                            : "border-red-200 bg-red-50/50 text-foreground"
                        }`}
                      >
                        <p className="mb-1 font-heading text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                          Avant
                        </p>
                        <p className="whitespace-pre-wrap break-words">
                          {c.beforeContent !== null
                            ? previewContent(c.beforeContent)
                            : "(section absente)"}
                        </p>
                      </div>
                      <div
                        className={`rounded-lg border p-3 text-xs leading-relaxed ${
                          c.kind === "removed"
                            ? "border-dashed border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] text-foreground-muted italic"
                            : "border-[var(--gaspe-teal-200)] bg-[var(--gaspe-teal-50)]/40 text-foreground"
                        }`}
                      >
                        <p className="mb-1 font-heading text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                          Après
                        </p>
                        <p className="whitespace-pre-wrap break-words">
                          {c.afterContent !== null
                            ? previewContent(c.afterContent)
                            : "(section supprimée)"}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] px-6 py-3 text-[11px] text-foreground-muted">
          Le contenu est affiché en texte brut (les balises HTML sont strippées
          pour la lisibilité). Pour restaurer une version, utilise le bouton
          «&nbsp;Restaurer&nbsp;» dans l&apos;historique.
        </div>
      </div>
    </div>
  );
}
