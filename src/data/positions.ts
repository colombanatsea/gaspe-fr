/* ------------------------------------------------------------------ */
/*  Positions & prises de parole GASPE – données éditoriales           */
/*                                                                     */
/*  Typographie : tiret semi-quadratique «–» autorisé,                 */
/*  tiret quadratique «–» interdit dans les textes publics.            */
/*  Les tests `positions.test.ts` font respecter la règle.             */
/*                                                                     */
/*  NOTE : le tableau est volontairement vide en attente de            */
/*  contributions éditoriales réelles. Les articles précédemment       */
/*  présents étaient des brouillons de démonstration ; ils ont été     */
/*  retirés pour que le site ne publie que des contenus validés.       */
/* ------------------------------------------------------------------ */

export type PositionTag = "Position" | "Actualité" | "Presse";

export interface PositionItem {
  /** Titre court (H1) – 50-70 caractères idéalement pour SEO */
  title: string;
  /** Date lisible affichée à l'utilisateur (ex : "Avril 2026") */
  date: string;
  /** ISO-like clef de tri (YYYY-MM ou YYYY-MM-DD) – utilisée pour sitemap + RSS */
  sortKey: string;
  /** Date ISO 8601 complète pour JSON-LD Article + RSS pubDate */
  publishedAt: string;
  /** Résumé 150-180 caractères (meta description + card) */
  excerpt: string;
  /** Type éditorial – définit le variant de badge */
  tag: PositionTag;
  /** Slug kebab-case – doit être unique (cf. tests) */
  slug: string;
  /** Corps HTML sanitisé (h2, h3, p, ul, ol, li, strong, em, a). Rendu via dangerouslySetInnerHTML + sanitizeHtml. */
  body: string;
  /** Image OG optionnelle (chemin absolu type /assets/og/positions/xxx.png) */
  ogImage?: string;
  /** Auteur – par défaut "GASPE" */
  author?: string;
}

export const positions: PositionItem[] = [];

/** Tri naturel par sortKey décroissant (plus récent en tête) */
export const publishedPositions: readonly PositionItem[] = [...positions].sort(
  (a, b) => b.sortKey.localeCompare(a.sortKey),
);

/** Récupère une position par slug, ou undefined */
export function getPositionBySlug(slug: string): PositionItem | undefined {
  return positions.find((p) => p.slug === slug);
}
