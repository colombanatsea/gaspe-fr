/* ------------------------------------------------------------------ */
/*  Centralized type exports                                           */
/*  Import from "@/types" for all shared types across the app.         */
/*  Domain-specific types still live in their source files but are     */
/*  re-exported here for convenience.                                  */
/* ------------------------------------------------------------------ */

/* ── Core domain types (defined here) ── */

/**
 * Détail d'un navire de la flotte d'une compagnie adhérente.
 * Champs optionnels — un nom minimal suffit ; les autres se remplissent au fil
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
  /** Numéro IMO (7 chiffres) — identifiant unique OMI, sans préfixe "IMO " */
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
  /** Consommation sur un trajet (format libre — litres, L/H, L/jour…) */
  consumptionPerTrip?: string;
  /** Nombre de rotations commerciales sur l'année 2024 */
  rotationsPerYear?: number;
  /** Équipage (format libre : "8", "2/3", "4 ou 3 sur PA") */
  crewSize?: string;
  /** Puissance installée (format libre : "5592", "2 x 2300 CV", "596 Kw") */
  powerKw?: string;
  /** Tests de combustibles alternatifs (biocarburants, additifs…) */
  altFuelTests?: string;
  /** Connexion à quai (cold ironing) — "Effective", "Souhaitée", "Non envisagée" */
  shorePower?: string;
  /** Traitement de coque (peinture antifouling) */
  hullTreatment?: string;
  /** Dispositifs de réduction des émissions déployés */
  emissionReduction?: string;
  /** Pavillon (ex: "RIF", "Premier registre") */
  flag?: string;
  /** URL photo ou page fiche navire */
  imageUrl?: string;
}

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
   * - "expert"    : partenaire métier (avocat, assureur, syndicat…) — uniquement parmi les associés
   * Défaut : "compagnie" si non précisé, "expert" sinon géré au filtrage.
   */
  memberType?: "compagnie" | "expert";
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  employeeCount?: number;
  shipCount?: number;
  /**
   * Flotte détaillée — liste des navires avec nom / IMO / type / capacité.
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
