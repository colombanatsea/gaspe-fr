/* ------------------------------------------------------------------ */
/*  Auth types – shared across the auth module                         */
/* ------------------------------------------------------------------ */

export type UserRole = "admin" | "adherent" | "candidat";

export type ApplicationStatus =
  | "pending"      // Envoyée
  | "viewed"       // Vue par l'entreprise
  | "shortlisted"  // Présélectionnée
  | "interview"    // Entretien planifié
  | "accepted"     // Acceptée
  | "rejected";    // Refusée

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: "teal" | "blue" | "warm" | "green" | "neutral"; icon: string }> = {
  pending:     { label: "Envoyée",        variant: "neutral", icon: "clock" },
  viewed:      { label: "Vue",            variant: "blue",    icon: "eye" },
  shortlisted: { label: "Présélectionnée", variant: "teal",   icon: "star" },
  interview:   { label: "Entretien",      variant: "warm",    icon: "calendar" },
  accepted:    { label: "Acceptée",       variant: "green",   icon: "check" },
  rejected:    { label: "Refusée",        variant: "neutral",  icon: "x" },
};

export type CompanyRole =
  | "dirigeant"
  | "exploitation"
  | "armement"
  | "paie"
  | "technique"
  | "logistique"
  | "achats"
  | "formation";

export const COMPANY_ROLES: { value: CompanyRole; label: string }[] = [
  { value: "dirigeant", label: "Dirigeant" },
  { value: "exploitation", label: "Exploitation" },
  { value: "armement", label: "Armement" },
  { value: "paie", label: "Paie" },
  { value: "technique", label: "Technique" },
  { value: "logistique", label: "Logistique" },
  { value: "achats", label: "Achats" },
  { value: "formation", label: "Formation" },
];

export interface Vessel {
  id: string;
  name: string;
  imo?: string;
  ums?: string;
  size?: string;
}

export type MembershipStatus = "due" | "paid" | "pending";

/* ── Organization (company entity) ── */

export interface Organization {
  id: string;
  slug: string;
  name: string;
  category: "titulaire" | "associe";
  territory?: "metropole" | "dom-tom";
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  websiteUrl?: string;
  address?: string;
  email?: string;
  phone?: string;
  description?: string;
  employeeCount?: number;
  shipCount?: number;
  membershipStatus?: MembershipStatus;
  createdAt?: string;
  updatedAt?: string;
}

/* ── Newsletter preferences (per-user, 10 categories) ── */

/**
 * 10 catégories newsletter – clés alignées sur les colonnes de la table D1
 * `newsletter_preferences` (migration 0003) et sur `CATEGORY_TO_LIST_ENV`
 * dans `workers/api.ts`. Session 29 : `communication_marque` supprimée,
 * remplacée par `veille_data` (ADF) pour cohérence DB ↔ frontend ↔ Brevo.
 */
export const NEWSLETTER_CATEGORIES = [
  { key: "info_generales", label: "Informations Generales", adherentOnly: true },
  { key: "ag", label: "Assemblee Generale (AG)", adherentOnly: true },
  { key: "emploi", label: "Emploi (CV et offres d'emploi)", adherentOnly: false },
  { key: "formation_opco", label: "Formation & OPCO", adherentOnly: false },
  { key: "veille_juridique", label: "Veille Juridique et Institutionnelle ADF", adherentOnly: true },
  { key: "veille_sociale", label: "Veille Sociale ADF", adherentOnly: true },
  { key: "veille_surete", label: "Veille Surete Securite ADF", adherentOnly: true },
  { key: "veille_data", label: "Veille Data ADF", adherentOnly: true },
  { key: "veille_environnement", label: "Veille Environnement ADF", adherentOnly: true },
  { key: "actualites_gaspe", label: "Actualites GASPE", adherentOnly: false },
] as const;

export type NewsletterCategory = typeof NEWSLETTER_CATEGORIES[number]["key"];

export type NewsletterPreferences = Record<NewsletterCategory, boolean>;

/* ── Invitation (responsable invites team members) ── */

export interface Invitation {
  id: string;
  organizationId: string;
  invitedBy: string;
  email: string;
  name?: string;
  orgRole?: string;
  token: string;
  expiresAt: string;
  accepted: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  phone?: string;
  approved?: boolean;
  archived?: boolean;
  /** Organization link (replaces company name in multi-contact model) */
  organizationId?: string;
  isPrimary?: boolean;
  invitedBy?: string;
  /** Adherent-specific */
  companyRole?: CompanyRole;
  companyDescription?: string;
  companyLogo?: string; // base64 data URL
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyLinkedinUrl?: string;
  vessels?: Vessel[];
  membershipStatus?: MembershipStatus;
  /** Candidat-specific */
  currentPosition?: string;
  desiredPosition?: string;
  preferredZone?: string;
  savedOffers?: string[];
  applications?: { offerId: string; date: string; status: ApplicationStatus; message?: string }[];
  experience?: string;
  certifications?: string;
  cvFilename?: string;
  profilePhoto?: string; // base64 data URL
  linkedinUrl?: string;
  /** Structured certifications – ENM titres format */
  structuredCertifications?: {
    certId: string;
    title: string;
    enmReference?: string; // n° ENM (ex: 10216913)
    obtainedDate?: string;
    expiryDate?: string;
    status?: "valid" | "expired" | "pending";
    reference?: string;
    verified?: boolean;
  }[];
  /** Sea service history – ENM lignes de service format */
  seaService?: {
    id: string;
    vesselName: string;
    vesselImo?: string;
    vesselType?: string;
    rank: string;
    category?: string;
    startDate: string;
    endDate?: string;
    source?: "manual" | "enm_csv";
  }[];
  /** Medical aptitude – ENM aptitude médicale format */
  medicalAptitude?: {
    visitType?: string;
    lastVisitDate?: string;
    expiryDate?: string;
    decision?: string;
    duration?: string;
    restrictions?: string[];
  };
  /** ENM portal ID (n° marin) */
  enmMarinId?: string;
  createdAt: string;
}

export type RegisterData = {
  role: "adherent";
  name: string;
  email: string;
  password: string;
  phone: string;
  company: string;
} | {
  role: "candidat";
  name: string;
  email: string;
  password: string;
  phone: string;
  currentPosition?: string;
  desiredPosition?: string;
};

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => Promise<User[]>;
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
  updateUser: (updated: User) => void;
}
