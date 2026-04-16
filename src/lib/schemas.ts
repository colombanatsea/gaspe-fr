/* ------------------------------------------------------------------ */
/*  Zod schemas for localStorage data validation                       */
/*  Prevents crashes from corrupted/tampered localStorage data         */
/* ------------------------------------------------------------------ */

import { z } from "zod";

/* ── Auth schemas ── */

const applicationStatusSchema = z.enum([
  "pending", "viewed", "shortlisted", "interview", "accepted", "rejected",
]);

const userRoleSchema = z.enum(["admin", "adherent", "candidat"]);

const companyRoleSchema = z.enum([
  "dirigeant", "exploitation", "armement", "paie",
  "technique", "logistique", "achats", "formation",
]);

const vesselSchema = z.object({
  id: z.string(),
  name: z.string(),
  imo: z.string().optional(),
  ums: z.string().optional(),
  size: z.string().optional(),
});

const applicationSchema = z.object({
  offerId: z.string(),
  date: z.string(),
  status: applicationStatusSchema,
  message: z.string().optional(),
});

const structuredCertSchema = z.object({
  certId: z.string(),
  obtainedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  reference: z.string().optional(),
  verified: z.boolean().optional(),
});

const seaServiceSchema = z.object({
  id: z.string(),
  vesselName: z.string(),
  vesselType: z.string().optional(),
  rank: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: userRoleSchema,
  company: z.string().optional(),
  phone: z.string().optional(),
  approved: z.boolean().optional(),
  archived: z.boolean().optional(),
  companyRole: companyRoleSchema.optional(),
  companyDescription: z.string().optional(),
  companyLogo: z.string().optional(),
  companyAddress: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
  companyLinkedinUrl: z.string().optional(),
  vessels: z.array(vesselSchema).optional(),
  membershipStatus: z.enum(["due", "paid", "pending"]).optional(),
  currentPosition: z.string().optional(),
  desiredPosition: z.string().optional(),
  preferredZone: z.string().optional(),
  savedOffers: z.array(z.string()).optional(),
  applications: z.array(applicationSchema).optional(),
  experience: z.string().optional(),
  certifications: z.string().optional(),
  cvFilename: z.string().optional(),
  profilePhoto: z.string().optional(),
  linkedinUrl: z.string().optional(),
  structuredCertifications: z.array(structuredCertSchema).optional(),
  seaService: z.array(seaServiceSchema).optional(),
  createdAt: z.string(),
});

export const usersArraySchema = z.array(userSchema);
export const passwordsSchema = z.record(z.string(), z.string());

/* ── CMS schemas ── */

export const mediaItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  data: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
  alt: z.string().optional(),
});

export const mediaArraySchema = z.array(mediaItemSchema);

const pageSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["richtext", "text", "image", "config"]),
  content: z.string(),
});

export const pageContentSchema = z.object({
  pageId: z.string(),
  sections: z.array(pageSectionSchema),
  updatedAt: z.string(),
});

export const pagesRecordSchema = z.record(z.string(), pageContentSchema);

/* ── Members schema ── */

export const memberSchema = z.object({
  name: z.string(),
  slug: z.string(),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  region: z.string(),
  territory: z.enum(["metropole", "dom-tom"]),
  category: z.enum(["titulaire", "associe"]),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  employeeCount: z.number().optional(),
  shipCount: z.number().optional(),
  archived: z.boolean().optional(),
});

export const membersArraySchema = z.array(memberSchema);

/* ── Safe parse helper ── */

/**
 * Parse JSON from localStorage with Zod validation.
 * Returns fallback if data is missing, malformed, or fails validation.
 */
export function safeParse<T>(
  schema: z.ZodType<T>,
  raw: string | null,
  fallback: T,
): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    console.warn("[GASPE] localStorage validation failed, using fallback:", result.error.issues?.[0]);
    return fallback;
  } catch {
    return fallback;
  }
}
