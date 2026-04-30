/**
 * Diff cote front entre deux snapshots de validation_history (annee N vs N-1).
 *
 * Logique miroir de `workers/handlers/validation-helpers.ts:diffSnapshots`
 * (teste cote Worker, 14 tests vitest). On duplique ici pour eviter les
 * imports cross-tree (workers/ exclu du tsconfig front). Toute modification
 * de la regle metier doit etre repercutee dans les deux fichiers.
 */

export type DiffStatus = "added" | "removed" | "modified" | "unchanged";

export interface DiffEntry {
  field: string;
  before: unknown;
  after: unknown;
  status: DiffStatus;
}

export interface DiffOptions {
  includeUnchanged?: boolean;
  excludeFields?: readonly string[];
}

const DEFAULT_EXCLUDE: readonly string[] = ["id"];

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = sortKeys((value as Record<string, unknown>)[k]);
      return acc;
    }, {});
}

export function diffSnapshots(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  options: DiffOptions = {},
): DiffEntry[] {
  const beforeObj = before ?? {};
  const afterObj = after ?? {};
  const exclude = new Set(options.excludeFields ?? DEFAULT_EXCLUDE);
  const allFields = new Set([
    ...Object.keys(beforeObj),
    ...Object.keys(afterObj),
  ]);
  const result: DiffEntry[] = [];
  for (const field of allFields) {
    if (exclude.has(field)) continue;
    const b = beforeObj[field] ?? null;
    const a = afterObj[field] ?? null;
    let status: DiffStatus;
    if (b === null && a === null) status = "unchanged";
    else if (b === null && a !== null) status = "added";
    else if (b !== null && a === null) status = "removed";
    else if (deepEqual(b, a)) status = "unchanged";
    else status = "modified";

    if (status === "unchanged" && !options.includeUnchanged) continue;
    result.push({ field, before: b, after: a, status });
  }
  const order: Record<DiffStatus, number> = {
    modified: 0,
    added: 1,
    removed: 2,
    unchanged: 3,
  };
  result.sort((x, y) => {
    if (order[x.status] !== order[y.status]) {
      return order[x.status] - order[y.status];
    }
    return x.field.localeCompare(y.field);
  });
  return result;
}

/** Libelles francais pour l'affichage. */
export const FIELD_LABELS_FR: Record<string, string> = {
  // Profil organisation
  email: "Email",
  phone: "Telephone",
  address: "Adresse",
  websiteUrl: "Site web",
  logoUrl: "Logo",
  description: "Description",
  employeeCount: "Effectifs",
  shipCount: "Nombre de navires",
  // Navire
  name: "Nom",
  imo: "IMO",
  type: "Type",
  flag: "Pavillon",
  yearBuilt: "Annee de construction",
  passengerCapacity: "Capacite passagers",
  vehicleCapacity: "Capacite vehicules",
  freightCapacity: "Capacite fret",
  grossTonnage: "Jauge brute",
  crewByBrevet: "Equipage par brevet",
};

/** Format human-friendly pour une valeur de snapshot. */
export function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 0);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
