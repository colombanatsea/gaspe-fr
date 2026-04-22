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
 * des données éditoriales (importées du tableur adhérents).
 */
export interface FleetVessel {
  /** Nom commercial du navire */
  name: string;
  /** Numéro IMO (7 chiffres) — identifiant unique OMI, sans préfixe "IMO " */
  imo?: string;
  /** Type / usage : bac, catamaran, ferry, navette fluviale, roulier… */
  type?: string;
  /** Année de mise en service */
  yearBuilt?: number;
  /** Capacité passagers max */
  passengerCapacity?: number;
  /** Capacité véhicules max */
  vehicleCapacity?: number;
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
