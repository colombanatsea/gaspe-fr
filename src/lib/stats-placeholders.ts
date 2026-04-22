/**
 * Stats placeholders – substitution dynamique dans les chaînes CMS.
 *
 * Les contenus éditoriaux (via `cms-defaults.ts` et D1 `cms_pages`) peuvent
 * contenir des placeholders `{key}` qui seront remplacés au rendu par les
 * valeurs calculées depuis `members.ts`. Cela garantit que les chiffres
 * (adhérents, navires, hexagone/outre-mer…) restent cohérents quand un
 * adhérent est ajouté/retiré, sans forcer l'admin à mettre à jour chaque page.
 *
 * Utilisation dans le CMS :
 *   "{adherents} adhérents maritimes réunis"
 *   "{compagniesHexagone} dans l'hexagone, {compagniesOutreMer} en outre-mer"
 *
 * Pour les listes (stats-items), les `value` peuvent aussi contenir des placeholders :
 *   { value: "{adherents}", label: "Adhérents" }
 */

import { memberStats } from "@/data/members";

type StatsDict = Record<string, string | number>;

/** Dictionnaire des placeholders supportés. */
export const STATS_DICT: StatsDict = {
  // Adhérents / compagnies
  adherents: memberStats.adherents,
  compagnies: memberStats.compagnies,
  titulaires: memberStats.titulaires,
  associes: memberStats.associes,
  experts: memberStats.experts,
  // Géographie
  compagniesHexagone: memberStats.compagniesHexagone,
  compagniesOutreMer: memberStats.compagniesOutreMer,
  adherentsHexagone: memberStats.adherentsHexagone,
  adherentsOutreMer: memberStats.adherentsOutreMer,
  regions: memberStats.regions,
  // Flotte / effectifs
  navires: memberStats.totalShips,
  marinsDeclares: memberStats.totalEmployees,
};

/** Remplace les placeholders `{key}` par leur valeur numérique. */
export function interpolateStats(text: string, dict: StatsDict = STATS_DICT): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = dict[key];
    return value !== undefined ? String(value) : match;
  });
}

/** Parse une chaîne JSON en liste d'objets et interpole les placeholders sur chaque champ string. */
export function parseList<T>(json: string, dict: StatsDict = STATS_DICT): T[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
        out[k] = typeof v === "string" ? interpolateStats(v, dict) : v;
      }
      return out as T;
    });
  } catch {
    return [];
  }
}
