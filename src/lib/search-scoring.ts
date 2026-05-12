/**
 * Moteur de scoring fulltext pour la barre de recherche homepage (item
 * G1 du test utilisateur post-launch). Fonctions pures, isolées dans
 * un module dédié pour tests unitaires.
 *
 * Le scoring favorise les matches dans :
 *   - title : +5 (signal le plus fort)
 *   - tags : +3 (signal explicite éditeur)
 *   - excerpt : +2
 *   - body : +1 (signal le plus faible)
 *
 * La normalisation retire les accents et passe en minuscules pour
 * permettre les recherches sans accent (« Iles » match « Îles »).
 */

import { stripHtmlPreview } from "./text-preview";

/** Normalise pour la recherche : minuscules + retire les accents. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Découpe la requête en termes (ignore mots vides courts < 2 caractères). */
export function tokenize(q: string): string[] {
  return normalize(q)
    .split(/[\s,;]+/)
    .filter((t) => t.length >= 2);
}

export interface ScorableDoc {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  tags?: string[] | null;
}

/**
 * Score un document contre une liste de termes normalisés. Retourne 0
 * si aucun terme ne match. Le score est additif (un terme peut
 * matcher plusieurs champs).
 */
export function scoreDocument(doc: ScorableDoc, terms: string[]): number {
  if (terms.length === 0) return 0;
  const title = normalize(doc.title);
  const excerpt = normalize(doc.excerpt ?? "");
  const body = normalize(stripHtmlPreview(doc.content ?? "", 5000));
  const tags = (doc.tags ?? []).map(normalize).join(" ");

  let score = 0;
  for (const t of terms) {
    if (title.includes(t)) score += 5;
    if (tags.includes(t)) score += 3;
    if (excerpt.includes(t)) score += 2;
    if (body.includes(t)) score += 1;
  }
  return score;
}

/**
 * Trie une liste de documents par pertinence décroissante par rapport à
 * une query. Élimine les documents avec score == 0.
 */
export function rankDocuments<T extends ScorableDoc>(
  docs: T[],
  query: string,
): Array<{ doc: T; score: number }> {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  return docs
    .map((doc) => ({ doc, score: scoreDocument(doc, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
