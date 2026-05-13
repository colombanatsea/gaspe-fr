/**
 * Handlers offres d'emploi : CRUD + soft-delete (P2-2, migration 0036).
 *
 * Admin OU adhérent peuvent créer. Update / Delete : owner OU admin.
 * Liste publique : seulement les offres publiées ; admin voit tout.
 *
 * Extrait de `workers/api.ts` en J1 vague 5.a.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken } from "../lib/auth";
import { sanitize } from "../lib/sanitize";
import { logAudit } from "../lib/audit";
import type { Env } from "../lib/env";

interface DbJob {
  id: string; slug: string; title: string; company: string; company_slug: string;
  location: string; zone: string; contract_type: string; category: string;
  brevet: string | null; description: string; profile: string | null;
  conditions: string | null; contact_email: string | null; contact_name: string | null;
  contact_phone: string | null; application_url: string | null; reference: string | null;
  start_date: string | null; salary_range: string | null; salary_min: number | null;
  handi_accessible: number; published: number; published_at: string;
  expires_at: string | null; source: string; created_by: string | null;
  hydros_offer_url: string | null; hydros_offer_id: string | null;
  application_deadline: string | null;
  created_at: string; updated_at: string;
}

function toFrontendJob(row: DbJob) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.company,
    companySlug: row.company_slug,
    location: row.location,
    zone: row.zone,
    contractType: row.contract_type,
    category: row.category,
    brevet: row.brevet ?? undefined,
    description: row.description,
    profile: row.profile ?? "",
    conditions: row.conditions ?? "",
    contactEmail: row.contact_email ?? "",
    contactName: row.contact_name ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    applicationUrl: row.application_url ?? undefined,
    reference: row.reference ?? undefined,
    startDate: row.start_date ?? undefined,
    salaryRange: row.salary_range ?? undefined,
    salaryMin: row.salary_min ?? undefined,
    handiAccessible: row.handi_accessible === 1 ? true : undefined,
    published: row.published === 1,
    publishedAt: row.published_at,
    expiresAt: row.expires_at ?? undefined,
    source: row.source,
    createdBy: row.created_by ?? undefined,
    hydrosOfferUrl: row.hydros_offer_url ?? undefined,
    hydrosOfferId: row.hydros_offer_id ?? undefined,
    applicationDeadline: row.application_deadline ?? undefined,
  };
}

export async function handleJobsList(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  let isAdmin = false;
  if (token) {
    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (payload?.role === "admin") isAdmin = true;
  }

  const query = isAdmin
    ? "SELECT * FROM jobs ORDER BY published_at DESC"
    : "SELECT * FROM jobs WHERE published = 1 ORDER BY published_at DESC";

  const { results } = await env.DB.prepare(query).all<DbJob>();
  return json({ jobs: (results ?? []).map(toFrontendJob) }, corsHeaders);
}

export async function handleJobGet(env: Env, corsHeaders: Record<string, string>, jobId: string) {
  const row = await env.DB.prepare("SELECT * FROM jobs WHERE id = ? OR slug = ?").bind(jobId, jobId).first<DbJob>();
  if (!row) return json({ error: "Offre introuvable" }, corsHeaders, 404);
  return json({ job: toFrontendJob(row) }, corsHeaders);
}

export async function handleJobCreate(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  if (payload.role !== "admin" && payload.role !== "adherent") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const title = body.title as string;
  const company = body.company as string;

  if (!title?.trim() || !company?.trim()) {
    return json({ error: "Titre et entreprise requis" }, corsHeaders, 400);
  }

  const id = (body.id as string) || `${payload.role === "admin" ? "admin" : "adherent"}-${Date.now()}`;
  const slug = (body.slug as string) || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  await env.DB.prepare(`
    INSERT INTO jobs (id, slug, title, company, company_slug, location, zone, contract_type, category,
      brevet, description, profile, conditions, contact_email, contact_name, contact_phone,
      application_url, reference, start_date, salary_range, salary_min, handi_accessible,
      published, published_at, expires_at, application_deadline, source, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, slug, sanitize(title.trim()), sanitize(company.trim()),
    (body.companySlug as string) || company.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    sanitize((body.location as string) || ""),
    (body.zone as string) || "normandie",
    (body.contractType as string) || "CDI",
    (body.category as string) || "Autre",
    (body.brevet as string) || null,
    (body.description as string) || "",
    (body.profile as string) || null,
    (body.conditions as string) || null,
    (body.contactEmail as string) || null,
    (body.contactName as string) || null,
    (body.contactPhone as string) || null,
    (body.applicationUrl as string) || null,
    (body.reference as string) || null,
    (body.startDate as string) || null,
    (body.salaryRange as string) || null,
    (body.salaryMin as number) || null,
    body.handiAccessible ? 1 : 0,
    body.published !== false ? 1 : 0,
    (body.publishedAt as string) || new Date().toISOString().split("T")[0],
    (body.expiresAt as string) || null,
    (body.applicationDeadline as string) || null,
    payload.role === "admin" ? "admin" : "adherent",
    payload.sub,
  ).run();

  const row = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(id).first<DbJob>();
  return json({ success: true, job: row ? toFrontendJob(row) : null }, corsHeaders, 201);
}

export async function handleJobUpdate(request: Request, env: Env, corsHeaders: Record<string, string>, jobId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const existing = await env.DB.prepare("SELECT created_by FROM jobs WHERE id = ?").bind(jobId).first<{ created_by: string | null }>();
  if (!existing) return json({ error: "Offre introuvable" }, corsHeaders, 404);
  if (payload.role !== "admin" && existing.created_by !== payload.sub) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const fieldMap: Record<string, string> = {
    title: "title", slug: "slug", company: "company", companySlug: "company_slug",
    location: "location", zone: "zone", contractType: "contract_type",
    category: "category", brevet: "brevet", description: "description",
    profile: "profile", conditions: "conditions", contactEmail: "contact_email",
    contactName: "contact_name", contactPhone: "contact_phone",
    applicationUrl: "application_url", reference: "reference", startDate: "start_date",
    salaryRange: "salary_range", salaryMin: "salary_min",
    handiAccessible: "handi_accessible", published: "published",
    publishedAt: "published_at", expiresAt: "expires_at",
    applicationDeadline: "application_deadline",
    hydrosOfferUrl: "hydros_offer_url", hydrosOfferId: "hydros_offer_id",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [fKey, dbCol] of Object.entries(fieldMap)) {
    if (fKey in body) {
      updates.push(`${dbCol} = ?`);
      const val = body[fKey];
      values.push(typeof val === "boolean" ? (val ? 1 : 0) : val);
    }
  }

  if (updates.length === 0) return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  updates.push("updated_at = datetime('now')");
  values.push(jobId);

  await env.DB.prepare(`UPDATE jobs SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  const row = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(jobId).first<DbJob>();
  return json({ success: true, job: row ? toFrontendJob(row) : null }, corsHeaders);
}

export async function handleJobDelete(request: Request, env: Env, corsHeaders: Record<string, string>, jobId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const before = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(jobId).first<DbJob>();
  if (!before) return json({ error: "Offre introuvable" }, corsHeaders, 404);
  if (payload.role !== "admin" && before.created_by !== payload.sub) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  // Soft-delete (P2-2, migration 0036) : is_archived=1 + published=0 plutôt
  // qu'un DELETE physique pour préserver l'historique pour audit. Fallback
  // DELETE physique si la colonne is_archived n'existe pas encore.
  try {
    await env.DB.prepare(
      "UPDATE jobs SET is_archived = 1, published = 0, updated_at = datetime('now') WHERE id = ?",
    ).bind(jobId).run();
  } catch {
    await env.DB.prepare("DELETE FROM jobs WHERE id = ?").bind(jobId).run();
  }

  await logAudit(
    env, request,
    { id: payload.sub, email: payload.email ?? null, role: payload.role },
    "job.delete", "job", jobId, before, null,
  );

  return json({ success: true, archived: true }, corsHeaders);
}
