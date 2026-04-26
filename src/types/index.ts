/* ------------------------------------------------------------------ */
/*  Centralized type exports                                           */
/*  Import from "@/types" for all shared types across the app.         */
/*  Domain-specific types still live in their source files but are     */
/*  re-exported here for convenience.                                  */
/* ------------------------------------------------------------------ */

/* ── Core domain types (defined here) ── */

/**
 * Détail d'un navire de la flotte d'une compagnie adhérente.
 * Champs optionnels – un nom minimal suffit ; les autres se remplissent au fil
 * des données éditoriales (tableur adhérents v2024) ou via l'admin CMS / l'espace
 * adhérent. Les champs "libres" (crewSize, powerKw, consumption…) sont des
 * strings pour tolérer les formats mixtes du tableur source ("2 x 2300 CV",
 * "2/3", "596 Kw", "70L/H"…).
 */
export interface FleetVessel {
  /** Identifiant stable (généré au create, sert de clé UI) */
  id?: string;
  /** Nom commercial du navire */
  name: string;
  /** Numéro IMO (7 chiffres) – identifiant unique OMI, sans préfixe "IMO " */
  imo?: string;
  /** Type / usage : bac, catamaran, ferry, navette fluviale, roulier… */
  type?: string;
  /** Ligne d'exploitation (ex: "Le Conquet / Molène – Ouessant") */
  operatingLine?: string;
  /** Année de mise en service */
  yearBuilt?: number;
  /** Longueur hors-tout (mètres) */
  length?: number;
  /** Largeur / maître-bau (mètres) */
  beam?: number;
  /** Tonnage UMS (jauge brute) */
  grossTonnage?: number;
  /** Capacité passagers max */
  passengerCapacity?: number;
  /** Capacité véhicules max */
  vehicleCapacity?: number;
  /** Capacité fret (tonnes) */
  freightCapacity?: number;
  /** Type de renouvellement souhaité (ex: "Achat neuf", "Refit", "Retrofit hybride") */
  renewalType?: string;
  /** Année(s) souhaitée(s) de renouvellement (ex: "2028", "2032-2034", "entre 2026 et 2030") */
  renewalYear?: string;
  /** Propriétaire (armateur, collectivité, leasing…) */
  owner?: string;
  /** Chantier de construction */
  shipyard?: string;
  /** Pays du chantier */
  shipyardCountry?: string;
  /** Type de propulsion (ex: "4 Hydrojet MGO", "Voith", "Diesel électrique") */
  propulsionType?: string;
  /** Carburant principal (GO, MGO, MDO, GO pêche, Électricité, GNL…) */
  fuelType?: string;
  /** Vitesse moyenne (nœuds) */
  cruiseSpeed?: number;
  /** Consommation sur un trajet (format libre – litres, L/H, L/jour…) */
  consumptionPerTrip?: string;
  /** Nombre de rotations commerciales sur l'année 2024 */
  rotationsPerYear?: number;
  /** Équipage (format libre : "8", "2/3", "4 ou 3 sur PA") */
  crewSize?: string;
  /** Puissance installée (format libre : "5592", "2 x 2300 CV", "596 Kw") */
  powerKw?: string;
  /** Tests de combustibles alternatifs (biocarburants, additifs…) */
  altFuelTests?: string;
  /** Connexion à quai (cold ironing) – "Effective", "Souhaitée", "Non envisagée" */
  shorePower?: string;
  /** Traitement de coque (peinture antifouling) */
  hullTreatment?: string;
  /** Dispositifs de réduction des émissions déployés */
  emissionReduction?: string;
  /** Pavillon (ex: "RIF", "Premier registre") */
  flag?: string;
  /** URL photo ou page fiche navire */
  imageUrl?: string;
  /**
   * Composition d'équipage par brevet/qualification (CCN 3228).
   * Map clé→effectif. Clés alignées sur `CREW_BREVETS` (cf. ci-dessous).
   * Coexiste avec `crewSize` (texte libre) — `crewByBrevet` est la version
   * structurée utilisable pour matching candidat/poste et recherches multi-critères.
   */
  crewByBrevet?: Partial<Record<CrewBrevetKey, number>>;
}

/**
 * Brevets et niveaux CCN 3228 retenus pour la composition d'équipage des
 * navires. Aligné sur `CLASSIFICATION_LEVELS` dans `src/data/ccn3228.ts`
 * (page /boite-a-outils#classifications) — un libellé unique pour le site
 * institutionnel ET le formulaire flotte.
 *
 * Validé par le user (session 38) :
 * - PONT (8 niveaux) : matelot → capitaine illimité
 * - MACHINE (5 niveaux) : matelot machine → chef méca illimité
 * - SERVICES (2 niveaux) : agent polyvalent + commissaire de bord
 * - NAVPAX : certificat optionnel (pas un brevet, marqué à part)
 *
 * Note acronymes pédagogiques :
 * - CMP = Certificat de Matelot Pont (débutant)
 * - CMQP = Certificat de Matelot de Quart à la Passerelle (intermédiaire)
 * - CMQ Pont = Certificat de Marin Qualifié Pont (Able Seafarer Deck STCW II/5)
 */
export type CrewBrevetKey =
  // Pont
  | "matelot"
  | "matelot_qualifie"
  | "maitre_equipage"
  | "patron_vedette_50ums"
  | "capitaine_50_200"
  | "capitaine_200_500"
  | "capitaine_500_3000"
  | "capitaine_3000_plus"
  // Machine
  | "matelot_machine"
  | "officier_mecanicien"
  | "chef_meca_750"
  | "chef_meca_3000"
  | "chef_meca_8000"
  | "chef_meca_illimite"
  // Services / hôtelier
  | "agent_service_polyvalent"
  | "commissaire_bord"
  // Certificat optionnel passagers
  | "navpax";

export type CrewBrevetCategory = "pont" | "machine" | "services" | "certificat";

export interface CrewBrevetSpec {
  key: CrewBrevetKey;
  /** Libellé court (form + card) */
  label: string;
  /** Libellé long (tooltip / aide contextuelle) */
  hint?: string;
  category: CrewBrevetCategory;
}

/**
 * Liste ordonnée des brevets pour rendu UI. L'ordre détermine l'affichage
 * dans le formulaire (groupé par catégorie) et la card lecture seule.
 */
export const CREW_BREVETS: readonly CrewBrevetSpec[] = [
  // PONT
  { key: "matelot", label: "Matelot", category: "pont", hint: "CMP – Certificat de Matelot Pont (débutant)" },
  { key: "matelot_qualifie", label: "Matelot qualifié", category: "pont", hint: "CMQP – quart passerelle" },
  { key: "maitre_equipage", label: "Maître d'équipage (Bosco)", category: "pont", hint: "CMQ Pont senior – Able Seafarer Deck STCW II/5" },
  { key: "patron_vedette_50ums", label: "Patron de vedette < 50 UMS", category: "pont", hint: "Brevet capitaine 200 + CFBS" },
  { key: "capitaine_50_200", label: "Capitaine 50–200 UMS", category: "pont", hint: "Brevet capitaine 200 + CGO" },
  { key: "capitaine_200_500", label: "Capitaine 200–500 UMS", category: "pont", hint: "Brevet capitaine 500 + CGO" },
  { key: "capitaine_500_3000", label: "Capitaine 500–3000 UMS", category: "pont", hint: "Brevet capitaine 3000 + CGO" },
  { key: "capitaine_3000_plus", label: "Capitaine > 3000 UMS", category: "pont", hint: "Brevet capitaine illimité + CGO" },
  // MACHINE
  { key: "matelot_machine", label: "Matelot machine", category: "machine", hint: "Certificat matelot machine + CFBS" },
  { key: "officier_mecanicien", label: "Officier mécanicien", category: "machine", hint: "Encadrement service machine sous l'autorité du chef méca" },
  { key: "chef_meca_750", label: "Chef mécanicien 750 kW", category: "machine" },
  { key: "chef_meca_3000", label: "Chef mécanicien 3000 kW", category: "machine" },
  { key: "chef_meca_8000", label: "Chef mécanicien 8000 kW", category: "machine" },
  { key: "chef_meca_illimite", label: "Chef mécanicien illimité", category: "machine", hint: "Sans limitation de puissance" },
  // SERVICES
  { key: "agent_service_polyvalent", label: "Agent de service / Matelot polyvalent passagers", category: "services", hint: "CFBS – accueil passagers, sécurité à bord" },
  { key: "commissaire_bord", label: "Commissaire de bord", category: "services", hint: "CFBS + ISPS – responsable services hôteliers" },
  // CERTIFICAT
  { key: "navpax", label: "NAVPAX (formation navires à passagers)", category: "certificat", hint: "STCW V/2 – obligatoire CCN 3228 pour ferries" },
];

export const CREW_BREVET_CATEGORY_LABELS: Record<CrewBrevetCategory, string> = {
  pont: "Pont",
  machine: "Machine",
  services: "Services / hôtelier",
  certificat: "Certificat optionnel",
};

export interface Member {
  name: string;
  slug: string;
  city: string;
  latitude: number;
  longitude: number;
  region: string;
  territory: "metropole" | "dom-tom";
  category: "titulaire" | "associe";
  /**
   * Type d'adhérent :
   * - "compagnie" : armateur/opérateur maritime (toutes les titulaires + 6 associés compagnies)
   * - "expert"    : partenaire métier (avocat, assureur, syndicat…) – uniquement parmi les associés
   * Défaut : "compagnie" si non précisé, "expert" sinon géré au filtrage.
   */
  memberType?: "compagnie" | "expert";
  /**
   * Collège ACF (gouvernance, droits de vote AG / cotisations) :
   * - "A" : Opérateurs publics (SEM, régies, services départementaux, syndicats mixtes)
   * - "B" : Opérateurs privés (SAS, SA, entreprises)
   * - "C" : Experts (avocats, courtiers) & Collectivités
   * Source : dispatch ACF (cf. simulation cotisations).
   */
  college?: "A" | "B" | "C";
  /**
   * Compagnie soumise à la CCN 3228 (Convention collective passages d'eau).
   * → participe aux votes NAO et mandats sociaux. Affiché en badge "3228".
   * Vrai pour la plupart des compagnies A et B, faux pour les experts/collectivités.
   */
  social3228?: boolean;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  employeeCount?: number;
  shipCount?: number;
  /**
   * Flotte détaillée – liste des navires avec nom / IMO / type / capacité.
   * Saisie via le tableur adhérents puis intégrée en code ou via l'admin CMS.
   * Quand renseignée, la page publique `/nos-adherents/[slug]` affiche un
   * bloc "Flotte" avec les détails par navire. `shipCount` reste la source
   * de vérité pour le compteur total (tolère les flottes non détaillées).
   */
  fleet?: FleetVessel[];
}

export interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
  children?: NavItem[];
}

export interface StatItem {
  value: number;
  label: string;
  suffix?: string;
}

/* ── Auth types (re-exported from auth module) ── */

export type {
  User,
  UserRole,
  ApplicationStatus,
  CompanyRole,
  MembershipStatus,
  Vessel,
  RegisterData,
  Organization,
  NewsletterCategory,
  NewsletterPreferences,
  Invitation,
} from "@/lib/auth/types";

export { NEWSLETTER_CATEGORIES } from "@/lib/auth/types";

/* ── Job types (re-exported from data) ── */

export type { Job, Zone } from "@/data/jobs";

/* ── Matching types (re-exported from lib) ── */

export type { MatchResult } from "@/lib/matching";

/* ── CMS types (re-exported from store) ── */

export type { MediaItem, PageSection, PageContent } from "@/lib/cms-store";

/* ── Members store types ── */

export type { StoredMember } from "@/lib/members-store";

/* ─────────────────────────────────────────────────────────────────────
   Système de votes (session 38, migration 0018-0019)
   Spec : 5 types (choix simple/multiple, texte, classement, dates),
   2 audiences (AG/AGE = Collèges A+B, NAO = social_3228),
   1 vote par organisation, suppléant peut voter en lieu et place,
   visibilité admin + titulaire/suppléant uniquement.
───────────────────────────────────────────────────────────────────── */

export type VoteType =
  | "single_choice"
  | "multiple_choice"
  | "text"
  | "ranking"
  | "date_selection";

export type VoteAudience = "ag_ab" | "social_3228";

export type VoteStatus = "draft" | "open" | "closed";

export const VOTE_TYPE_LABELS: Record<VoteType, string> = {
  single_choice: "Choix simple",
  multiple_choice: "Choix multiple",
  text: "Réponse libre",
  ranking: "Classement de plusieurs items",
  date_selection: "Sélection de dates",
};

export const VOTE_AUDIENCE_LABELS: Record<VoteAudience, string> = {
  ag_ab: "Collèges A et B (AG / AGE)",
  social_3228: "Collège social CCN 3228 (NAO / mandats sociaux)",
};

export const VOTE_AUDIENCE_HINTS: Record<VoteAudience, string> = {
  ag_ab: "Vote ouvert aux compagnies A et B (gouvernance ACF). Les collèges C (experts) ne participent pas.",
  social_3228: "Vote ouvert aux compagnies sous CCN 3228. Mandats sociaux et négociations collectives.",
};

/** Une option de vote (pour single/multiple/ranking). */
export interface VoteOption {
  id: string;
  label: string;
}

export interface Vote {
  id: string;
  title: string;
  description?: string;
  type: VoteType;
  audience: VoteAudience;
  /**
   * Données structurées dépendant du type :
   * - single/multiple/ranking : VoteOption[]
   * - date_selection : string[] (dates ISO)
   * - text : []
   */
  options: VoteOption[] | string[];
  status: VoteStatus;
  /** ISO timestamp de clôture automatique (optionnel). */
  closesAt?: string;
  createdBy: string;
  createdAt: string;
  closedAt?: string;
  closedBy?: string;
}

/**
 * Réponse d'une organisation à un vote.
 * 1 par (vote_id, organization_id) — le titulaire peut écraser celle du
 * suppléant (et inversement, le suppléant voit la réponse du titulaire).
 */
export interface VoteResponse {
  id: string;
  voteId: string;
  organizationId: string;
  /** User qui a soumis (id du titulaire OU id du suppléant). */
  submittedBy: string;
  /**
   * Payload du vote, structuré selon `Vote.type` :
   * - single_choice : string (option id)
   * - multiple_choice : string[] (option ids)
   * - text : string
   * - ranking : string[] (option ids dans l'ordre du classement)
   * - date_selection : string[] (dates ISO sélectionnées)
   */
  response: string | string[];
  submittedAt: string;
}

/** Résultats agrégés d'un vote, calculés côté Worker. */
export interface VoteResults {
  voteId: string;
  totalEligible: number;
  totalResponded: number;
  /** Pour single/multiple/ranking : nombre de fois où chaque option a été choisie. */
  optionCounts?: Record<string, number>;
  /** Pour text : tableau des réponses brutes (pas d'agrégation). */
  textResponses?: Array<{ organizationName: string; response: string; submittedAt: string }>;
  /** Liste des organisations ayant répondu (avec timestamp). */
  responders: Array<{ organizationId: string; organizationName: string; submittedAt: string; submittedByName?: string }>;
  /** Liste des organisations n'ayant PAS répondu (pour mailto relance). */
  nonResponders: Array<{ organizationId: string; organizationName: string; titulaireEmail?: string; suppleantEmail?: string }>;
}
