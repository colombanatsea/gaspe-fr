/**
 * Helpers de formatage de dates / timestamps charte FR.
 *
 * Centralise les patterns repetes dans les composants admin
 * (CmsRevisionDiff, CmsRevisionsModal, CustomPageRevisionsModal) qui
 * tous parsent un ISO timestamp et le rendent au format `DD/MM/YYYY HH:mm`.
 */

/**
 * Formate un timestamp ISO en `DD/MM/YYYY HH:mm` (locale fr-FR).
 *
 * - Si l'ISO ne contient pas de `T`, suppose un format SQLite
 *   `YYYY-MM-DD HH:MM:SS` et insère `T...Z` pour parsing UTC.
 * - Fallback silencieux sur la chaine ISO brute en cas d'erreur.
 */
export function formatTimestamp(iso: string): string {
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

/**
 * Formate une date `YYYY-MM-DD` en `DD/MM/YYYY` (locale fr-FR), sans heure.
 * Utile pour les date pickers et affichages courts.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00Z");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formate un nombre au format FR (séparateur milliers espace).
 * Wrapper sûr autour de `toLocaleString` qui retourne `"-"` si invalid.
 */
export function formatNumber(n: number | null | undefined, maxFractionDigits = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-";
  return n.toLocaleString("fr-FR", { maximumFractionDigits: maxFractionDigits });
}
