/* ------------------------------------------------------------------ */
/*  Documents officiels GASPE – seed + types                           */
/*                                                                     */
/*  Source de vérité : table D1 `cms_documents` (migration 0010).      */
/*  Ce fichier fournit :                                                */
/*   1. Les types partagés (`GaspeDocument`, `DocumentCategory`)       */
/*   2. Un seed local utilisé en fallback démo/dev si le Worker D1     */
/*      n'est pas disponible. Miroir logique de la migration SQL.      */
/* ------------------------------------------------------------------ */

export type DocumentCategory =
  | "ccn-accords"
  | "institutionnels"
  | "reglementaire"
  | "rapports";

export interface GaspeDocument {
  id: string;
  title: string;
  description: string;
  category: DocumentCategory;
  /** URL du fichier (R2 via /api/media/raw/:key, /assets/..., ou URL externe). "#" = pas encore déposé */
  fileUrl: string;
  /** Nom d'affichage du fichier (ex : "Statuts-GASPE-2026.pdf") */
  fileName: string;
  /** ISO date YYYY-MM-DD (ou null si pas datée, ex: règlement intérieur) */
  publishedAt: string | null;
  sortOrder: number;
  /** true = public, false = adhérents connectés uniquement */
  isPublic: boolean;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  "ccn-accords": "Convention collective & accords de branche",
  institutionnels: "Documents institutionnels",
  reglementaire: "Réglementation",
  rapports: "Rapports",
};

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "ccn-accords",
  "institutionnels",
  "reglementaire",
  "rapports",
];

/**
 * Seed – miroir 1:1 de `workers/migrations/0010_cms_documents.sql`.
 * Sert de fallback pour le mode localStorage (démo/dev) uniquement.
 */
export const DOCUMENTS_SEED: GaspeDocument[] = [
  {
    id: "doc-ccn-3228",
    title:
      "Convention Collective Nationale du personnel navigant des passages d'eau (CCN 3228 / IDCC 3228)",
    description:
      "Convention collective nationale régissant le personnel navigant des entreprises de passages d'eau (IDCC 3228).",
    category: "ccn-accords",
    fileUrl: "#",
    fileName: "",
    publishedAt: "2026-03-01",
    sortOrder: 0,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-accord-salaires",
    title: "Accord de branche sur les salaires",
    description:
      "Accord NAO de la branche – barèmes salariaux et indemnités.",
    category: "ccn-accords",
    fileUrl: "#",
    fileName: "",
    publishedAt: "2026-01-01",
    sortOrder: 1,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-accord-prevoyance",
    title: "Accord de branche sur la prévoyance complémentaire",
    description:
      "Accord de branche régissant la prévoyance complémentaire maritime.",
    category: "ccn-accords",
    fileUrl: "#",
    fileName: "",
    publishedAt: "2025-11-01",
    sortOrder: 2,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-accord-formation",
    title: "Accord de branche sur la formation professionnelle",
    description:
      "Accord de branche – formation professionnelle continue et apprentissage.",
    category: "ccn-accords",
    fileUrl: "#",
    fileName: "",
    publishedAt: "2025-10-01",
    sortOrder: 3,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-avenant-classification",
    title: "Avenant classification et grilles de salaires",
    description:
      "Avenant relatif aux classifications et grilles de salaires de la branche.",
    category: "ccn-accords",
    fileUrl: "#",
    fileName: "",
    publishedAt: "2025-09-01",
    sortOrder: 4,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-statuts",
    title: "Statuts du GASPE",
    description: "Statuts juridiques de l'association GASPE.",
    category: "institutionnels",
    fileUrl: "#",
    fileName: "",
    publishedAt: null,
    sortOrder: 0,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-reglement-interieur",
    title: "Règlement intérieur",
    description: "Règlement intérieur du Groupement.",
    category: "institutionnels",
    fileUrl: "#",
    fileName: "",
    publishedAt: null,
    sortOrder: 1,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-rapport-activite-2025",
    title: "Rapport d'activité 2025",
    description: "Rapport annuel d'activité 2025 du GASPE.",
    category: "institutionnels",
    fileUrl: "#",
    fileName: "",
    publishedAt: "2026-03-01",
    sortOrder: 2,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-liste-membres",
    title: "Liste des membres",
    description: "Liste à jour des 31 membres adhérents du GASPE.",
    category: "institutionnels",
    fileUrl: "#",
    fileName: "",
    publishedAt: "2026-01-01",
    sortOrder: 3,
    isPublic: true,
    published: true,
  },
];
