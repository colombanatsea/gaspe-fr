/**
 * Type DB et mapper user. Partagé entre les handlers auth, organisations,
 * équipe, etc.
 *
 * Extrait de `workers/api.ts` en J1 vague 3.
 */

import { parseStaffPerms } from "./auth";

/** Row brute de la table `users` D1. */
export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff" | "adherent" | "candidat";
  staff_permissions: string | null;
  company: string | null;
  phone: string | null;
  approved: number;
  archived: number;
  company_role: string | null;
  company_description: string | null;
  company_logo: string | null;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  current_position: string | null;
  desired_position: string | null;
  preferred_zone: string | null;
  experience: string | null;
  certifications: string | null;
  cv_filename: string | null;
  profile_photo: string | null;
  linkedin_url: string | null;
  company_linkedin_url: string | null;
  membership_status: string | null;
  organization_id: string | null;
  is_primary: number;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  // C9 (migration 0044) : flag master admin transferable.
  is_master_admin?: number;
}

/** Convertit une row D1 en shape User attendu côté frontend. */
export function toFrontendUser(row: DbUser) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    staffPermissions: parseStaffPerms(row.staff_permissions) ?? undefined,
    company: row.company ?? undefined,
    phone: row.phone ?? undefined,
    approved: row.approved === 1,
    archived: row.archived === 1,
    companyRole: row.company_role ?? undefined,
    companyDescription: row.company_description ?? undefined,
    companyLogo: row.company_logo ?? undefined,
    companyAddress: row.company_address ?? undefined,
    companyEmail: row.company_email ?? undefined,
    companyPhone: row.company_phone ?? undefined,
    currentPosition: row.current_position ?? undefined,
    desiredPosition: row.desired_position ?? undefined,
    preferredZone: row.preferred_zone ?? undefined,
    experience: row.experience ?? undefined,
    certifications: row.certifications ?? undefined,
    cvFilename: row.cv_filename ?? undefined,
    profilePhoto: row.profile_photo ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    companyLinkedinUrl: row.company_linkedin_url ?? undefined,
    membershipStatus: row.membership_status ?? undefined,
    organizationId: row.organization_id ?? undefined,
    isPrimary: row.is_primary === 1,
    invitedBy: row.invited_by ?? undefined,
    createdAt: row.created_at,
    isMasterAdmin: row.is_master_admin === 1,
  };
}
