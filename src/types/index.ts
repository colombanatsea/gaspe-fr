/* ------------------------------------------------------------------ */
/*  Centralized type exports                                           */
/*  Import from "@/types" for all shared types across the app.         */
/*  Domain-specific types still live in their source files but are     */
/*  re-exported here for convenience.                                  */
/* ------------------------------------------------------------------ */

/* ── Core domain types (defined here) ── */

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
