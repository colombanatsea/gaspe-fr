/**
 * Handlers organisations adhérentes (table organizations).
 *
 * List public, get JWT, update admin/primary. Le PATCH inclut les
 * champs admin-only (membership_status, archived, college, social3228,
 * identité hors slug).
 *
 * Le module exporte aussi `DbOrganization` et `toFrontendOrg`, utilisés
 * par d'autres handlers (votes audience, validation campaigns, flotte
 * cross-share).
 *
 * Extrait de `workers/api.ts` en J1 vague 6.a.
 */

import { json } from "../lib/json";
import { requireJwt } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { type DbUser, toFrontendUser } from "../lib/users";
import type { Env } from "../lib/env";

export interface DbOrganization {
  id: string; slug: string; name: string; category: string;
  college: string | null; social3228: number | null;
  territory: string | null; region: string | null; city: string | null;
  latitude: number | null; longitude: number | null;
  logo_url: string | null; website_url: string | null;
  address: string | null; email: string | null; phone: string | null;
  description: string | null;
  employee_count: number | null; ship_count: number | null;
  // Migration 0038 (B5/C3) — colonnes optionnelles, peuvent être absentes en preprod
  employee_count_navigant?: number | null;
  employee_count_sedentaire?: number | null;
  annual_revenue_eur?: number | null;
  revenue_confidential?: number | null;
  membership_status: string | null;
  archived: number | null;
  created_at: string; updated_at: string;
}

export function toFrontendOrg(row: DbOrganization) {
  return {
    id: row.id, slug: row.slug, name: row.name, category: row.category,
    college: (row.college as "A" | "B" | "C" | null) ?? undefined,
    social3228: row.social3228 === 1 ? true : row.social3228 === 0 ? false : undefined,
    territory: row.territory ?? undefined, region: row.region ?? undefined,
    city: row.city ?? undefined,
    latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined,
    logoUrl: row.logo_url ?? undefined, websiteUrl: row.website_url ?? undefined,
    address: row.address ?? undefined, email: row.email ?? undefined,
    phone: row.phone ?? undefined, description: row.description ?? undefined,
    employeeCount: row.employee_count ?? undefined, shipCount: row.ship_count ?? undefined,
    employeeCountNavigant: row.employee_count_navigant ?? undefined,
    employeeCountSedentaire: row.employee_count_sedentaire ?? undefined,
    annualRevenueEur: row.annual_revenue_eur ?? undefined,
    revenueConfidential: row.revenue_confidential === 1,
    membershipStatus: row.membership_status ?? undefined,
    archived: row.archived === 1,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function handleListOrganizations(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const url = new URL(request.url);
  const includeArchived = url.searchParams.get("include_archived") === "1";
  // Fetch all then filter in JS – resilient to missing archived column (pre-migration 0007)
  const { results } = await env.DB.prepare("SELECT * FROM organizations ORDER BY name").all<DbOrganization>();
  const rows = results ?? [];
  const filtered = includeArchived ? rows : rows.filter((r) => r.archived !== 1);
  return json({ organizations: filtered.map(toFrontendOrg) }, corsHeaders);
}

export async function handleGetOrganization(
  request: Request, env: Env, corsHeaders: Record<string, string>, orgId: string,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const org = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?").bind(orgId).first<DbOrganization>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  const { results } = await env.DB.prepare(
    "SELECT * FROM users WHERE organization_id = ? AND archived = 0 ORDER BY is_primary DESC, name",
  ).bind(orgId).all<DbUser>();

  return json({
    organization: toFrontendOrg(org),
    contacts: (results ?? []).map(toFrontendUser),
  }, corsHeaders);
}

export async function handleUpdateOrganization(
  request: Request, env: Env, corsHeaders: Record<string, string>, orgId: string,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  // Only admin or primary contact of this org can update
  if (payload.role !== "admin") {
    const user = await env.DB.prepare("SELECT is_primary, organization_id FROM users WHERE id = ?").bind(payload.sub).first<{ is_primary: number; organization_id: string | null }>();
    if (!user || user.organization_id !== orgId || user.is_primary !== 1) {
      return json({ error: "Accès refusé" }, corsHeaders, 403);
    }
  }

  const body = await request.json() as Record<string, unknown>;
  const allowedFields: Record<string, string> = {
    logoUrl: "logo_url", websiteUrl: "website_url", address: "address",
    email: "email", phone: "phone", description: "description",
    employeeCount: "employee_count", shipCount: "ship_count",
    // Session 55 (B5 + C3) : split effectif navigant/sédentaire + CA confidentiel
    employeeCountNavigant: "employee_count_navigant",
    employeeCountSedentaire: "employee_count_sedentaire",
    annualRevenueEur: "annual_revenue_eur",
    revenueConfidential: "revenue_confidential",
    membershipStatus: "membership_status", archived: "archived",
    college: "college", social3228: "social3228",
    // C4 (session 57) : identité (hors slug) modifiable par admin.
    // Le slug reste volontairement absent — il sert de permalien public et
    // n'est pas modifiable post-création pour préserver le SEO.
    name: "name", city: "city", region: "region",
    latitude: "latitude", longitude: "longitude",
    territory: "territory", category: "category",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [frontendKey, dbCol] of Object.entries(allowedFields)) {
    if (frontendKey in body) {
      // Champs admin-only : statut, archivage, collège, conv. sociale,
      // et l'ensemble de l'identité hors slug (name, city, region, lat/lng,
      // territory, category). Le slug n'est pas dans allowedFields.
      const adminOnly = new Set([
        "membershipStatus", "archived", "college", "social3228",
        "name", "city", "region", "latitude", "longitude", "territory", "category",
      ]);
      if (adminOnly.has(frontendKey) && payload.role !== "admin") continue;
      updates.push(`${dbCol} = ?`);
      // Booléens (frontend → 0/1 SQLite)
      const boolFields = new Set(["social3228", "revenueConfidential"]);
      const val = boolFields.has(frontendKey) ? (body[frontendKey] ? 1 : 0) : body[frontendKey];
      values.push(val);
    }
  }

  if (updates.length === 0) return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);

  // Snapshot before pour audit
  const before = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?").bind(orgId).first<Record<string, unknown>>();

  updates.push("updated_at = datetime('now')");
  values.push(orgId);

  await env.DB.prepare(`UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();

  // Snapshot after
  const after = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?").bind(orgId).first<Record<string, unknown>>();

  await logAudit(
    env, request,
    { id: payload.sub, email: payload.email ?? null, role: payload.role },
    "organization.update", "organization", orgId, before, after,
  );

  return json({ success: true }, corsHeaders);
}
