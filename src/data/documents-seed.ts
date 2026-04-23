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
/**
 * URLs absolues des fichiers hébergés sur gaspe.fr (WordPress media library).
 * Source : page publique https://www.gaspe.fr/documents/ récupérée en session 36.
 */
const GASPE_FR = "https://www.gaspe.fr/wp-content/uploads";

export const DOCUMENTS_SEED: GaspeDocument[] = [
  // ═══════════════════════════════════════════════════════════════════
  //  Convention collective & accords de branche
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "doc-ccn-3228",
    title:
      "Convention Collective Nationale du personnel navigant des passages d'eau (CCN 3228 / IDCC 3228)",
    description:
      "Convention collective nationale régissant le personnel navigant des entreprises de passages d'eau (IDCC 3228).",
    category: "ccn-accords",
    fileUrl: `${GASPE_FR}/2025/10/CCN-GASPE.pdf`,
    fileName: "CCN-GASPE.pdf",
    publishedAt: "2025-10-01",
    sortOrder: 0,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-accord-nao-2025",
    title: "Accord NAO 2025 – salaires et indemnités",
    description:
      "Accord de branche signé issu de la négociation annuelle obligatoire (NAO) 2025 – barèmes salariaux et indemnités applicables à la CCN 3228.",
    category: "ccn-accords",
    fileUrl: `${GASPE_FR}/2025/12/Accord-NAO-2025-signe.pdf`,
    fileName: "Accord-NAO-2025-signe.pdf",
    publishedAt: "2025-12-01",
    sortOrder: 1,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-rapport-extension-nao",
    title: "Rapport sur l'extension de l'accord NAO",
    description:
      "Rapport motivant la demande d'extension de l'accord NAO auprès du ministère du Travail pour une application à l'ensemble de la branche.",
    category: "ccn-accords",
    fileUrl: `${GASPE_FR}/2025/12/Rapport-extension-accord-NAO-GASPE.pdf`,
    fileName: "Rapport-extension-accord-NAO-GASPE.pdf",
    publishedAt: "2025-12-15",
    sortOrder: 2,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-accord-egalite-pro",
    title: "Accord de branche sur l'égalité professionnelle",
    description:
      "Accord signé relatif à l'égalité professionnelle entre les femmes et les hommes dans la branche maritime côtière.",
    category: "ccn-accords",
    fileUrl: `${GASPE_FR}/2025/12/Accord-egalite-professionnelle-signe.pdf`,
    fileName: "Accord-egalite-professionnelle-signe.pdf",
    publishedAt: "2025-12-01",
    sortOrder: 3,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-accord-retraites-supp",
    title: "Accord retraites supplémentaires CCN 3228",
    description:
      "Accord de branche du 26 janvier 2026 instaurant les retraites supplémentaires pour les salariés relevant de la CCN 3228.",
    category: "ccn-accords",
    fileUrl: `${GASPE_FR}/2026/02/20260126-Accord-Retraites-Supplementaires-CCN-3228.pdf`,
    fileName: "20260126-Accord-Retraites-Supplementaires-CCN-3228.pdf",
    publishedAt: "2026-01-26",
    sortOrder: 4,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-accord-formation",
    title: "Accord de branche sur la formation professionnelle",
    description:
      "Accord de branche – formation professionnelle continue et apprentissage (à publier).",
    category: "ccn-accords",
    fileUrl: "#",
    fileName: "",
    publishedAt: "2025-10-01",
    sortOrder: 5,
    isPublic: true,
    published: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  //  Documents institutionnels
  // ═══════════════════════════════════════════════════════════════════
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
    description: "Rapport annuel d'activité 2025 du GASPE (à publier).",
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
    description: "Liste à jour des 30 adhérents du GASPE (26 compagnies + 4 experts).",
    category: "institutionnels",
    fileUrl: "#",
    fileName: "",
    publishedAt: "2026-01-01",
    sortOrder: 3,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-formulaire-adhesion",
    title: "Formulaire de demande d'adhésion",
    description:
      "Formulaire à compléter pour toute demande d'adhésion au GASPE (compagnies maritimes et experts).",
    category: "institutionnels",
    fileUrl: `${GASPE_FR}/2026/01/Formulaire-demande-adhesion-1.pdf`,
    fileName: "Formulaire-demande-adhesion.pdf",
    publishedAt: "2026-01-01",
    sortOrder: 4,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-candidature-titulaire-associe",
    title: "Candidature Membre Titulaire ou Associé",
    description:
      "Dossier de candidature pour les compagnies maritimes de proximité souhaitant devenir membre titulaire ou associé du GASPE (format Word).",
    category: "institutionnels",
    fileUrl: `${GASPE_FR}/2026/01/Candidature-Compagnie-Maritime-de-Proximite.docx`,
    fileName: "Candidature-Compagnie-Maritime-de-Proximite.docx",
    publishedAt: "2026-01-01",
    sortOrder: 5,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-candidature-expert",
    title: "Candidature Membre Expert",
    description:
      "Dossier de candidature pour les experts (avocats, courtiers, syndicats professionnels) souhaitant rejoindre le GASPE en qualité d'expert (format Word).",
    category: "institutionnels",
    fileUrl: `${GASPE_FR}/2026/01/Candidature-Expert-Maritime-de-Proximite-1.docx`,
    fileName: "Candidature-Expert-Maritime-de-Proximite.docx",
    publishedAt: "2026-01-01",
    sortOrder: 6,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-kit-logo",
    title: "Logo GASPE – kit média",
    description:
      "Logos officiels du GASPE (PNG, SVG, JPG, formats horizontal et vertical). Archive ZIP destinée à la presse et aux partenaires.",
    category: "institutionnels",
    fileUrl: `${GASPE_FR}/2025/07/Logo-GASPE.zip`,
    fileName: "Logo-GASPE.zip",
    publishedAt: "2025-07-01",
    sortOrder: 7,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-kit-couleurs",
    title: "Charte couleurs GASPE",
    description:
      "Palette de couleurs officielle GASPE (teal #1B7E8A et déclinaisons). Kit média pour usages presse et partenaires.",
    category: "institutionnels",
    fileUrl: `${GASPE_FR}/2025/07/Couleurs-GASPE.pdf`,
    fileName: "Couleurs-GASPE.pdf",
    publishedAt: "2025-07-01",
    sortOrder: 8,
    isPublic: true,
    published: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  //  Rapports financiers & conventions réglementées
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "doc-rapport-comptes-2024",
    title: "Rapport sur les comptes annuels – exercice clos au 30 juin 2024",
    description:
      "Rapport du commissaire aux comptes sur les comptes annuels de l'exercice clos au 30 juin 2024.",
    category: "rapports",
    fileUrl: `${GASPE_FR}/2024/12/001-20240630-Rapport-sur-les-comptes-annuels-1.pdf`,
    fileName: "Rapport-comptes-annuels-30-06-2024.pdf",
    publishedAt: "2024-12-01",
    sortOrder: 0,
    isPublic: true,
    published: true,
  },
  {
    id: "doc-rapport-conventions",
    title: "Rapport spécial sur les conventions réglementées – 2024",
    description:
      "Rapport spécial du commissaire aux comptes sur les conventions réglementées de l'exercice clos au 30 juin 2024.",
    category: "rapports",
    fileUrl: `${GASPE_FR}/2024/12/001-20240630-Rapport-special-sur-les-conventions-1.pdf`,
    fileName: "Rapport-conventions-reglementees-30-06-2024.pdf",
    publishedAt: "2024-12-01",
    sortOrder: 1,
    isPublic: true,
    published: true,
  },
];
