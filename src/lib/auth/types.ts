/* ------------------------------------------------------------------ */
/*  Auth types — shared across the auth module                         */
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

export const NEWSLETTER_CATEGORIES = [
  { key: "info_generales", label: "Informations Generales", adherentOnly: true },
  { key: "ag", label: "Assemblee Generale (AG)", adherentOnly: true },
  { key: "emploi", label: "Emploi (CV et offres d'emploi)", adherentOnly: false },
  { key: "formation_opco", label: "Formation & OPCO", adherentOnly: false },
  { key: "veille_juridique", label: "Veille Juridique et Institutionnelle", adherentOnly: true },
  { key: "veille_sociale", label: "Veille Sociale", adherentOnly: true },
  { key: "veille_surete", label: "Veille Surete Securite", adherentOnly: true },
  { key: "veille_environnement", label: "Veille Environnement", adherentOnly: true },
  { key: "communication_marque", label: "Communication & Marque employeur", adherentOnly: false },
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
  /** Structured certifications (replaces freetext) */
  structuredCertifications?: {
    certId: string;
    obtainedDate?: string;
    expiryDate?: string;
    reference?: string;
    verified?: boolean;
  }[];
  /** Sea service history */
  seaService?: {
    id: string;
    vesselName: string;
    vesselType?: string;
    rank: string;
    startDate: string;
    endDate?: string;
  }[];
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
