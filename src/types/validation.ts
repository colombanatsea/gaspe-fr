/**
 * Types partages pour la feature "Validation annuelle des donnees adherents".
 * Reflete les structures renvoyees par les endpoints Worker (session 45).
 * Voir docs/VALIDATION-ANNUELLE-FEATURE.md pour la spec.
 */

export type ValidationItemType = "profile" | "vessel";
export type CampaignStatus = "draft" | "open" | "closed";
export type CampaignUrgency =
  | "draft"
  | "open"
  | "due-soon"
  | "overdue"
  | "closed";

/** Une campagne de validation annuelle. */
export interface ValidationCampaign {
  id: number;
  targetYear: number;
  openedAt?: string;
  targetDate?: string;
  closedAt?: string;
  status: CampaignStatus;
  createdBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Snapshot du profil organisation au moment de la validation. */
export interface OrgProfileSnapshot {
  email: string | null;
  phone: string | null;
  address: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  employeeCount: number | null;
  shipCount: number | null;
}

/** Snapshot d'un navire au moment de la validation. */
export interface VesselSnapshot {
  id: string;
  name: string;
  imo: string | null;
  type: string | null;
  flag: string | null;
  yearBuilt: number | null;
  passengerCapacity: number | null;
  vehicleCapacity: number | null;
  freightCapacity: number | null;
  grossTonnage: number | null;
  crewByBrevet: Record<string, number> | null;
}

/** Une ligne d'historique de validation. */
export interface ValidationHistoryEntry {
  id: number;
  organizationId: string;
  itemType: ValidationItemType;
  itemId?: string;
  targetYear: number;
  validatedAt: string;
  validatedByUserId: string;
  snapshot: OrgProfileSnapshot | VesselSnapshot | null;
  isUnchanged: boolean;
  campaignId?: number;
  createdAt: string;
}

/** Item soumis dans le body POST /api/organizations/:slug/validations. */
export interface ValidationSubmitItem {
  type: ValidationItemType;
  /** Obligatoire si type === "vessel". */
  id?: string;
  /** True si l'adherent confirme sans modifier les valeurs. */
  unchanged: boolean;
  /** Mise a jour partielle des champs ; ignore si unchanged === true. */
  data?: Record<string, unknown>;
}

/** Reponse du POST validations. */
export interface ValidationSubmitResult {
  success: true;
  validated: number;
  targetYear: number;
  campaignId?: number;
}

/** Resume admin par compagnie pour le dashboard de campagne. */
export interface CampaignDashboardOrgRow {
  organizationId: string;
  organizationName: string;
  slug: string;
  profileValidated: boolean;
  vesselsValidated: number;
  vesselsTotal: number;
  fullyValidated: boolean;
  titulaireEmail: string | null;
}

export interface CampaignDashboard {
  campaign: ValidationCampaign;
  summary: {
    orgsTotal: number;
    orgsFullyValidated: number;
    vesselsValidated: number;
    vesselsTotal: number;
  };
  rows: CampaignDashboardOrgRow[];
}
