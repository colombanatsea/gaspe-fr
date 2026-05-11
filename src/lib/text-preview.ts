/**
 * text-preview.ts — helpers de formatage texte pour les tuiles / résumés.
 *
 * Couvre les bugs A5 + A6 du test utilisateur post-launch (session 54+++) :
 *   - description tuile formation affichait du HTML brut
 *     (« &lt;table border=&quot;0&quot;… ») sans rendu
 *   - cassures de caractères « l&#39; » dans positions
 *
 * 2 helpers exportés :
 *   - stripHtmlPreview(text, max?) : strip tags + decode entities + tronque
 *   - formatPrice(value) : ajoute « € » automatique si valeur numérique
 *     sans devise mentionnée
 */

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&apos;": "'",
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
  "&euro;": "€",
  "&copy;": "©",
  "&reg;": "®",
  "&hellip;": "…",
  "&laquo;": "«",
  "&raquo;": "»",
  "&ndash;": "–",
  "&mdash;": "—",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&rdquo;": "”",
  "&ldquo;": "“",
  "&middot;": "·",
  "&bull;": "•",
  "&larr;": "←",
  "&rarr;": "→",
  "&deg;": "°",
  "&times;": "×",
};

/**
 * Décode les entités HTML communes ainsi que les entités numériques
 * `&#NNN;` (décimal) et `&#xHH;` (hexa) — strict ASCII / Unicode safe.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    // Entités nommées
    .replace(/&[a-z]+;/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? m)
    // Entités numériques décimales : &#39;
    .replace(/&#(\d+);/g, (_m, n: string) => {
      const code = parseInt(n, 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    })
    // Entités numériques hexa : &#x27;
    .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    });
}

/**
 * Strip tags HTML + décode entités + normalise espaces + tronque.
 * Utilisé pour les tuiles (preview courte d'un contenu richtext).
 *
 * Différent de `sanitizeHtml` qui préserve un HTML safe pour rendu.
 * Ici on aplatit en pure text utilisable dans un `<p>` line-clamp.
 */
export function stripHtmlPreview(input: string, max = 200): string {
  if (!input) return "";
  // Strip tags HTML (greedy non-newline-aware ok pour preview)
  let plain = input.replace(/<[^>]+>/g, " ");
  // Décoder les entités
  plain = decodeHtmlEntities(plain);
  // Normaliser les espaces (incluant espace insécable U+00A0)
  plain = plain.replace(/[\s ]+/g, " ").trim();
  if (!plain) return "";
  if (plain.length > max) {
    return plain.slice(0, max).trimEnd() + "…";
  }
  return plain;
}

/**
 * Formate un prix pour l'affichage tuile.
 *
 * Règles :
 *   - vide / null / undefined → "" (caller décide affichage)
 *   - contient déjà € / EUR / Gratuit / Free → renvoyé tel quel
 *   - contient seulement des chiffres (et espaces / virgules / points) → suffixe " €"
 *   - sinon → renvoyé tel quel (ex: "Sur devis", "À partir de 500 €")
 */
export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value).trim();
  if (!s) return "";
  // Déjà une devise / mention
  if (/€|EUR|gratuit|free|sur devis|nous consulter/i.test(s)) return s;
  // Numérique pur (avec espaces / , / .)
  if (/^[\d\s.,]+$/.test(s)) return `${s} €`;
  return s;
}
