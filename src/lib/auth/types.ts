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

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  phone?: string;
  approved?: boolean;
  archived?: boolean;
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
  getAllUsers: () => User[];
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
  updateUser: (updated: User) => void;
}
