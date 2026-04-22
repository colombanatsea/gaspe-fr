/* ------------------------------------------------------------------ */
/*  Logique pure du diff entre deux snapshots de révision CMS.         */
/*  Extrait de `CmsRevisionDiff.tsx` pour être unit-testable.          */
/* ------------------------------------------------------------------ */

export interface CmsRevisionDetailSection {
  id: string;
  label: string;
  type: string;
  content: string;
}

export type ChangeKind = "added" | "removed" | "modified" | "unchanged";

export interface SectionChange {
  id: string;
  label: string;
  type: string;
  kind: ChangeKind;
  beforeContent: string | null;
  afterContent: string | null;
}

/**
 * Préview courte du contenu d'une section.
 * HTML strippé grossièrement, espaces normalisés, tronqué à `max`.
 */
export function previewContent(content: string, max = 240): string {
  if (!content) return "(vide)";
  const plain = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "(vide)";
  return plain.length > max ? plain.slice(0, max) + "…" : plain;
}

/**
 * Appariement par `section.id` de deux jeux de sections.
 * Retourne la liste des changements triés (modified > added > removed > unchanged,
 * puis alphabétique par id au sein du groupe).
 */
export function diffSections(
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

/** Compte les changements par catégorie (hors `unchanged`). */
export function summarizeChanges(changes: SectionChange[]): {
  modified: number;
  added: number;
  removed: number;
  unchanged: number;
  totalDiffs: number;
} {
  let modified = 0;
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (const c of changes) {
    if (c.kind === "modified") modified++;
    else if (c.kind === "added") added++;
    else if (c.kind === "removed") removed++;
    else unchanged++;
  }
  return {
    modified,
    added,
    removed,
    unchanged,
    totalDiffs: modified + added + removed,
  };
}
