"use client";

import { useEffect, useState, startTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listValidationsForOrg } from "@/lib/validation-store";
import {
  diffSnapshots,
  FIELD_LABELS_FR,
  formatDiffValue,
  type DiffEntry,
} from "@/lib/validation-diff";
import type { ValidationHistoryEntry } from "@/types/validation";

interface SnapshotDiffModalProps {
  slug: string;
  organizationName: string;
  targetYear: number;
  onClose: () => void;
}

interface ItemDiff {
  itemType: "profile" | "vessel";
  itemId: string | null;
  displayName: string;
  before: ValidationHistoryEntry | null;
  after: ValidationHistoryEntry | null;
  entries: DiffEntry[];
}

export function SnapshotDiffModal({
  slug,
  organizationName,
  targetYear,
  onClose,
}: SnapshotDiffModalProps) {
  const [history, setHistory] = useState<ValidationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const previousYear = targetYear - 1;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { history } = await listValidationsForOrg(slug);
        if (cancelled) return;
        startTransition(() => {
          setHistory(history);
          setLoading(false);
        });
      } catch {
        if (!cancelled) startTransition(() => setLoading(false));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Echap pour fermer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Pour chaque (itemType, itemId), prendre la derniere entree pour targetYear
  // et pour previousYear (history est trie par DESC sur target_year + validated_at).
  function pickLatestForYear(
    itemType: "profile" | "vessel",
    itemId: string | null,
    year: number,
  ): ValidationHistoryEntry | null {
    return (
      history.find(
        (h) =>
          h.itemType === itemType &&
          (h.itemId ?? null) === itemId &&
          h.targetYear === year,
      ) ?? null
    );
  }

  // Liste des items presents au moins une annee (paire profile + chaque vessel id)
  const itemKeys = new Set<string>();
  for (const h of history) {
    if (h.targetYear !== targetYear && h.targetYear !== previousYear) continue;
    const key = `${h.itemType}::${h.itemId ?? ""}`;
    itemKeys.add(key);
  }

  const items: ItemDiff[] = Array.from(itemKeys).map((key) => {
    const [itemType, itemId] = key.split("::") as [
      "profile" | "vessel",
      string,
    ];
    const id = itemId || null;
    const before = pickLatestForYear(itemType, id, previousYear);
    const after = pickLatestForYear(itemType, id, targetYear);
    const beforeSnap = (before?.snapshot ?? null) as Record<string, unknown> | null;
    const afterSnap = (after?.snapshot ?? null) as Record<string, unknown> | null;
    const displayName =
      itemType === "profile"
        ? "Profil de la compagnie"
        : (afterSnap?.name as string | undefined) ??
          (beforeSnap?.name as string | undefined) ??
          `Navire ${id ?? "?"}`;
    return {
      itemType,
      itemId: id,
      displayName,
      before,
      after,
      entries: diffSnapshots(beforeSnap, afterSnap),
    };
  });

  // Tri : profil en haut, puis par nom
  items.sort((a, b) => {
    if (a.itemType !== b.itemType) {
      return a.itemType === "profile" ? -1 : 1;
    }
    return a.displayName.localeCompare(b.displayName, "fr");
  });

  const totalChanges = items.reduce((acc, it) => acc + it.entries.length, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-modal-title"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-[var(--gaspe-neutral-200)] px-6 py-4 flex items-baseline justify-between gap-3">
          <div>
            <h2 id="diff-modal-title" className="font-heading text-lg font-bold text-foreground">
              Diff annuel – {organizationName}
            </h2>
            <p className="text-xs text-foreground-muted mt-1">
              Comparaison {previousYear} → {targetYear}
              {!loading && ` · ${totalChanges} changement${totalChanges !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={onClose}
            className="!px-3 !py-1.5 !text-xs"
            aria-label="Fermer le diff"
          >
            Fermer (Echap)
          </Button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {loading ? (
            <p className="text-sm text-foreground-muted">Chargement de l&apos;historique...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              Aucune validation enregistree pour {previousYear} ou {targetYear} pour cette compagnie.
            </p>
          ) : (
            items.map((item) => (
              <ItemDiffCard
                key={`${item.itemType}-${item.itemId ?? "_"}`}
                item={item}
                previousYear={previousYear}
                targetYear={targetYear}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ItemDiffCard({
  item,
  previousYear,
  targetYear,
}: {
  item: ItemDiff;
  previousYear: number;
  targetYear: number;
}) {
  const hasNothingPrevious = !item.before;
  const hasNothingCurrent = !item.after;

  return (
    <div className="rounded-xl border border-[var(--gaspe-neutral-200)] p-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
        <h3 className="font-heading text-base font-semibold text-foreground">
          {item.displayName}
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant={item.itemType === "profile" ? "blue" : "neutral"}>
            {item.itemType === "profile" ? "Profil" : "Navire"}
          </Badge>
          {item.entries.length === 0 ? (
            <Badge variant="green">Aucun changement</Badge>
          ) : (
            <Badge variant="warm">
              {item.entries.length} changement{item.entries.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {hasNothingPrevious && (
        <p className="text-xs text-foreground-muted italic mb-2">
          Pas de validation enregistree pour {previousYear} – nouvel item.
        </p>
      )}
      {hasNothingCurrent && (
        <p className="text-xs text-foreground-muted italic mb-2">
          Pas de validation enregistree pour {targetYear} – item plus suivi.
        </p>
      )}

      {item.entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-foreground-muted">
              <tr className="border-b border-[var(--gaspe-neutral-200)]">
                <th className="px-2 py-1.5 text-left font-heading uppercase tracking-wider">
                  Champ
                </th>
                <th className="px-2 py-1.5 text-left font-heading uppercase tracking-wider">
                  {previousYear}
                </th>
                <th className="px-2 py-1.5 text-left font-heading uppercase tracking-wider">
                  {targetYear}
                </th>
                <th className="px-2 py-1.5 text-center font-heading uppercase tracking-wider">
                  Etat
                </th>
              </tr>
            </thead>
            <tbody>
              {item.entries.map((entry) => (
                <DiffRow key={entry.field} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DiffRow({ entry }: { entry: DiffEntry }) {
  const label = FIELD_LABELS_FR[entry.field] ?? entry.field;
  const statusBadge = {
    modified: { variant: "warm" as const, label: "Modifie" },
    added: { variant: "green" as const, label: "Ajoute" },
    removed: { variant: "neutral" as const, label: "Retire" },
    unchanged: { variant: "neutral" as const, label: "Inchange" },
  }[entry.status];

  return (
    <tr className="border-t border-[var(--gaspe-neutral-100)] align-top">
      <td className="px-2 py-2 font-medium text-foreground">{label}</td>
      <td className="px-2 py-2 text-foreground-muted max-w-[200px] break-words">
        {entry.status === "added" ? (
          <span className="italic text-foreground-muted">—</span>
        ) : (
          <span className="font-mono text-[11px]">{formatDiffValue(entry.before)}</span>
        )}
      </td>
      <td className="px-2 py-2 max-w-[200px] break-words">
        {entry.status === "removed" ? (
          <span className="italic text-foreground-muted">—</span>
        ) : (
          <span className="font-mono text-[11px] text-[var(--gaspe-teal-700)] font-semibold">
            {formatDiffValue(entry.after)}
          </span>
        )}
      </td>
      <td className="px-2 py-2 text-center">
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </td>
    </tr>
  );
}
