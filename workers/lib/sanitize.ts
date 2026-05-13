/**
 * Helpers de sanitization Worker (anti-XSS).
 *
 * Extrait de `workers/api.ts` en J1 vague 3 pour partage cross-modules.
 * Le Worker n'importe pas `src/lib/sanitize-html.ts`.
 */

/** Échappe les caractères HTML dangereux pour insertion en texte brut. */
export function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" };
    return map[c] ?? c;
  });
}

/**
 * Sanitize HTML riche : préserve les balises inline / la structure mais
 * strip <script>, <style>, <iframe>, handlers `on*`, et `javascript:`.
 * Utilisé pour les champs `content` / `description` stockés en D1
 * (CMS, formations, positions).
 */
export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript\s*:/gi, "");
}
