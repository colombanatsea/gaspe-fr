/**
 * Helpers DB partagés — patterns récurrents dans les handlers CRUD.
 *
 * Posés en J1 post-clôture (session 70) pour eliminer la duplication
 * accumulée pendant les extractions vague par vague :
 * - `safeJsonParse` : 3 copies inline (positions, formations, anciennement api.ts)
 * - `slugify` : 4 variantes inline (jobs, documents, formations, positions)
 * - `numOrNull` / `strOrNull` : 1 copie dans organization-vessels, mais
 *   le pattern revient ailleurs sous forme inline ad-hoc
 */

/**
 * Parse une chaîne JSON. Retourne `fallback` si null/undefined/invalide.
 * Utile pour les colonnes TEXT qui sérialisent des arrays / objets.
 */
export function safeJsonParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/**
 * Conversion robuste d'une valeur arbitraire vers `number | null`.
 * - null / undefined / "" → null
 * - number fini → tel quel
 * - string parseable (avec virgule décimale FR supportée) → parsed
 * - reste → null
 */
export function numOrNull(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = typeof val === "number" ? val : Number(String(val).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Conversion robuste d'une valeur arbitraire vers `string | null`.
 * - null / undefined → null
 * - string trimmée vide → null
 * - sinon string trimmée
 */
export function strOrNull(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s ? s : null;
}

/**
 * Conversion bool → 0/1 (SQLite n'a pas de type boolean natif).
 * `true` / 1 / "1" / "true" → 1, le reste → 0.
 */
export function boolToInt(val: unknown): 0 | 1 {
  if (val === true || val === 1) return 1;
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (lower === "true" || lower === "1") return 1;
  }
  return 0;
}

/**
 * Génère un slug stable à partir d'un titre.
 *
 * - Normalise NFD + strip diacritiques (é → e, ç → c)
 * - Lowercase, remplace tout caractère non `[a-z0-9]` par `-`
 * - Trim les `-` en début/fin
 * - Tronque à `maxLength` (défaut 64, plage 1-200)
 *
 * Si le texte ne contient aucun caractère alphanumérique exploitable,
 * retourne `""` (l'appelant doit gérer ce cas, typiquement en fallback
 * sur un identifiant généré).
 */
export function slugify(text: string, maxLength: number = 64): string {
  if (!text) return "";
  const len = Math.min(Math.max(1, maxLength), 200);
  return text
    .toLowerCase()
    .normalize("NFD")
    // strip combining diacriticals U+0300..U+036F
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, len);
}
