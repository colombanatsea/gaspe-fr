/**
 * Handlers validation annuelle (session 45, migrations 0027-0029).
 * Spec : docs/VALIDATION-ANNUELLE-FEATURE.md
 *
 * Endpoints :
 * - GET    /api/campaigns                              (staff manage_validations)
 * - POST   /api/campaigns                              (staff manage_validations)
 * - PATCH  /api/campaigns/:id                          (staff manage_validations)
 * - GET    /api/campaigns/:id/dashboard                (staff manage_validations)
 * - GET    /api/organizations/:slug/validations        (admin / staff / same-org)
 * - POST   /api/organizations/:slug/validations        (admin / staff / same-org)
 *
 * Cron quotidien (session 51) :
 *   runValidationDeadlineCron(env) — scan ouvertes + envoi due_soon / overdue
 *   via Brevo. Idempotence via table validation_email_sent.
 *
 * Extrait de  en J1 vague 6.e.
 */

import { json } from "../lib/json";
import { requireStaffPermission, requireJwt } from "../lib/auth";
import { sanitize } from "../lib/sanitize";
import { sendBrevoTransactional } from "../lib/brevo";
import { SITE_URL } from "../lib/constants";
import type { Env } from "../lib/env";
import { type DbOrganization } from "./organizations";
import { type DbVessel } from "./organization-vessels";
import {
  buildProfileSnapshot,
  buildVesselSnapshot,
  parseValidationItems,
  resolveTargetYear,
  shouldNotifyDueSoon,
  shouldNotifyOverdue,
  ValidationInputError,
  type ValidationCampaignRow,
  type ValidationRequestItem,
} from "./validation-helpers";

// ═══════════════════════════════════════════════════════════
//  Validation campaigns – validation annuelle (session 45,
//  migrations 0027-0029). Spec : docs/VALIDATION-ANNUELLE-FEATURE.md
// ═══════════════════════════════════════════════════════════

interface DbCampaign {
  id: number;
  target_year: number;
  opened_at: string | null;
  target_date: string | null;
  closed_at: string | null;
  status: "draft" | "open" | "closed";
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbValidationHistory {
  id: number;
  organization_id: string;
  item_type: "profile" | "vessel";
  item_id: string | null;
  target_year: number;
  validated_at: string;
  validated_by_user_id: string;
  snapshot_json: string;
  is_unchanged: number;
  campaign_id: number | null;
  created_at: string;
}

function toFrontendCampaign(row: DbCampaign) {
  return {
    id: row.id,
    targetYear: row.target_year,
    openedAt: row.opened_at ?? undefined,
    targetDate: row.target_date ?? undefined,
    closedAt: row.closed_at ?? undefined,
    status: row.status,
    createdBy: row.created_by ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toFrontendValidationHistory(row: DbValidationHistory) {
  let snapshot: unknown = null;
  try { snapshot = JSON.parse(row.snapshot_json); } catch { /* ignore */ }
  return {
    id: row.id,
    organizationId: row.organization_id,
    itemType: row.item_type,
    itemId: row.item_id ?? undefined,
    targetYear: row.target_year,
    validatedAt: row.validated_at,
    validatedByUserId: row.validated_by_user_id,
    snapshot,
    isUnchanged: row.is_unchanged === 1,
    campaignId: row.campaign_id ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Cree les tables de validation si absentes (defensif, en cas de
 * deploiement avant migration). Les ALTER ADD COLUMN ne peuvent pas etre
 * repliques ici (SQLite ne supporte pas IF NOT EXISTS sur ALTER), donc les
 * colonnes last_validated_* ne sont pas garanties tant que la migration 0028
 * n'est pas appliquee. On gere les NULL implicitement dans les requetes.
 */
async function ensureValidationTables(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS fleet_validation_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_year INTEGER NOT NULL UNIQUE,
      opened_at TEXT NOT NULL,
      target_date TEXT,
      closed_at TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_campaigns_status ON fleet_validation_campaigns(status)"
    ).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS validation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT,
      target_year INTEGER NOT NULL,
      validated_at TEXT NOT NULL,
      validated_by_user_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      is_unchanged INTEGER NOT NULL DEFAULT 0,
      campaign_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_history_org_year ON validation_history(organization_id, target_year)"
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_history_item ON validation_history(item_type, item_id, target_year)"
    ).run();
  } catch { /* tables peuvent exister deja */ }
}

/**
 * Recupere la campagne actuellement ouverte (au plus une car target_year UNIQUE
 * + status='open'). Renvoie null si aucune. Utilise pour POST validations.
 */
async function getOpenCampaign(env: Env): Promise<ValidationCampaignRow | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE status = 'open' ORDER BY target_year DESC LIMIT 1"
  ).first<DbCampaign>();
  if (!row) return null;
  return {
    id: row.id,
    target_year: row.target_year,
    opened_at: row.opened_at,
    target_date: row.target_date,
    closed_at: row.closed_at,
    status: row.status,
    created_by: row.created_by,
    notes: row.notes,
  };
}

/**
 * Verifie qu'un user peut valider pour une organisation : admin OU member de
 * la meme org. Reutilise la meme regle que handleUpsertFleet.
 */
async function canActOnOrg(
  env: Env,
  payload: { sub: string | number; role: string },
  orgId: string,
): Promise<boolean> {
  if (payload.role === "admin") return true;
  // Staff avec permission manage_validations OU manage_organizations passe aussi
  if (payload.role === "staff") {
    try {
      const row = await env.DB.prepare("SELECT staff_permissions FROM users WHERE id = ?")
        .bind(payload.sub).first<{ staff_permissions: string | null }>();
      if (row?.staff_permissions) {
        try {
          const perms = JSON.parse(row.staff_permissions);
          if (Array.isArray(perms) && (perms.includes("manage_validations") || perms.includes("manage_organizations"))) return true;
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }
  // Adherent : doit etre lie a cette organisation
  const user = await env.DB.prepare(
    "SELECT organization_id FROM users WHERE id = ?"
  ).bind(payload.sub).first<{ organization_id: string | null }>();
  return user?.organization_id === orgId;
}

// ── GET /api/campaigns – admin/staff(validations) : liste + courante ──
export async function handleListCampaigns(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_validations");
  if ("error" in auth) return auth.error;

  await ensureValidationTables(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns ORDER BY target_year DESC"
  ).all<DbCampaign>();
  const campaigns = (results ?? []).map(toFrontendCampaign);
  const current = campaigns.find((c) => c.status === "open") ?? null;
  return json({ campaigns, current }, corsHeaders);
}

// ── POST /api/campaigns – admin/staff(validations) : cree une campagne ──
export async function handleCreateCampaign(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_validations");
  if ("error" in auth) return auth.error;

  await ensureValidationTables(env);
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  const targetYear = typeof body.targetYear === "number" ? body.targetYear : Number(body.targetYear);
  if (!Number.isInteger(targetYear) || targetYear < 2020 || targetYear > 2100) {
    return json({ error: "targetYear doit etre un entier entre 2020 et 2100" }, corsHeaders, 400);
  }
  const targetDate = typeof body.targetDate === "string" && body.targetDate ? body.targetDate : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const status = body.status === "open" ? "open" : "draft";
  const openedAt = status === "open" ? new Date().toISOString() : new Date(0).toISOString();

  // Unique constraint sur target_year : message metier explicite
  const existing = await env.DB.prepare(
    "SELECT id FROM fleet_validation_campaigns WHERE target_year = ?"
  ).bind(targetYear).first<{ id: number }>();
  if (existing) {
    return json({ error: `Une campagne existe deja pour ${targetYear}` }, corsHeaders, 409);
  }

  await env.DB.prepare(
    `INSERT INTO fleet_validation_campaigns
     (target_year, opened_at, target_date, status, created_by, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(targetYear, openedAt, targetDate, status, auth.userId, notes).run();

  const row = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE target_year = ?"
  ).bind(targetYear).first<DbCampaign>();

  // Side effect : creation directe en 'open' -> notifier les titulaires
  // + reset cotisations à 'due' (C7 du feedback post-launch session 60).
  if (row && row.status === "open") {
    try {
      await resetMembershipsToDue(env, request, auth.userId, row.target_year);
    } catch (err) {
      console.error("[validation] resetMembershipsToDue failed:", err);
    }
    try {
      await notifyCampaignOpened(env, row);
    } catch (err) {
      console.error("[validation] notifyCampaignOpened failed:", err);
    }
  }

  return json({ success: true, campaign: row ? toFrontendCampaign(row) : null }, corsHeaders);
}

/**
 * C7 hybride : au lancement d'une nouvelle campagne validation annuelle,
 * remettre toutes les cotisations à `due` (rythme classique d'un cycle
 * annuel : reset en début d'année, paiement progressif au fur et à
 * mesure). Audit-logué.
 */
async function resetMembershipsToDue(
  env: Env,
  request: Request,
  userId: string,
  targetYear: number,
) {
  // Comptage avant pour le log
  const beforeCounts = await env.DB.prepare(
    "SELECT membership_status, COUNT(*) AS n FROM organizations WHERE archived = 0 GROUP BY membership_status",
  ).all<{ membership_status: string | null; n: number }>();

  const res = await env.DB.prepare(
    `UPDATE organizations
        SET membership_status = 'due', updated_at = datetime('now')
      WHERE archived = 0
        AND (membership_status IS NULL
             OR membership_status NOT IN ('due'))`,
  ).run();

  const affected = res.meta?.changes ?? 0;

  try {
    await logAudit(
      env,
      request,
      { id: userId, email: null, role: "admin" },
      "memberships.reset_due",
      "organizations",
      null,
      { counts: beforeCounts.results ?? [], targetYear },
      { affected, newStatus: "due", targetYear },
    );
  } catch { /* best-effort */ }
}

// ── PATCH /api/campaigns/:id – admin/staff(orgs) : update statut/dates/notes ──
export async function handleUpdateCampaign(
  request: Request, env: Env, corsHeaders: Record<string, string>, campaignId: number,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_validations");
  if ("error" in auth) return auth.error;

  await ensureValidationTables(env);
  const existing = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE id = ?"
  ).bind(campaignId).first<DbCampaign>();
  if (!existing) return json({ error: "Campagne introuvable" }, corsHeaders, 404);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.status === "string") {
    if (!["draft", "open", "closed"].includes(body.status)) {
      return json({ error: "status invalide" }, corsHeaders, 400);
    }
    updates.push("status = ?");
    values.push(body.status);
    // Side effects sur les timestamps
    if (body.status === "open" && existing.status === "draft") {
      updates.push("opened_at = ?");
      values.push(new Date().toISOString());
    }
    if (body.status === "closed" && existing.status !== "closed") {
      updates.push("closed_at = ?");
      values.push(new Date().toISOString());
    }
  }
  if ("targetDate" in body) {
    updates.push("target_date = ?");
    values.push(typeof body.targetDate === "string" && body.targetDate ? body.targetDate : null);
  }
  if ("notes" in body) {
    updates.push("notes = ?");
    values.push(typeof body.notes === "string" ? body.notes.trim() || null : null);
  }

  if (updates.length === 0) {
    return json({ error: "Aucun champ a mettre a jour" }, corsHeaders, 400);
  }
  updates.push("updated_at = datetime('now')");
  values.push(campaignId);

  await env.DB.prepare(
    `UPDATE fleet_validation_campaigns SET ${updates.join(", ")} WHERE id = ?`
  ).bind(...values).run();

  const row = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE id = ?"
  ).bind(campaignId).first<DbCampaign>();

  // Side effect : si la campagne vient de basculer en 'open', notifier les
  // titulaires actifs par email Brevo (best-effort, no-op si pas de secrets)
  // ET reset cotisations à 'due' (C7 du feedback post-launch session 60).
  const justOpened = row && row.status === "open" && existing.status !== "open";
  if (justOpened && row) {
    try {
      await resetMembershipsToDue(env, request, auth.userId, row.target_year);
    } catch (err) {
      console.error("[validation] resetMembershipsToDue failed:", err);
    }
    // ctx.waitUntil indisponible dans cette signature → on attend mais on
    // capture toute exception pour ne pas faire echouer le PATCH.
    try {
      await notifyCampaignOpened(env, row);
    } catch (err) {
      console.error("[validation] notifyCampaignOpened failed:", err);
    }
  }

  return json({ success: true, campaign: row ? toFrontendCampaign(row) : null }, corsHeaders);
}

// ── GET /api/campaigns/:id/dashboard – admin/staff(orgs) : breakdown par compagnie ──
export async function handleCampaignDashboard(
  request: Request, env: Env, corsHeaders: Record<string, string>, campaignId: number,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_validations");
  if ("error" in auth) return auth.error;

  await ensureValidationTables(env);
  const campaign = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE id = ?"
  ).bind(campaignId).first<DbCampaign>();
  if (!campaign) return json({ error: "Campagne introuvable" }, corsHeaders, 404);

  const targetYear = campaign.target_year;

  // Compagnies actives et leurs titulaires
  const { results: orgs } = await env.DB.prepare(
    `SELECT id, name, slug, last_validated_year
     FROM organizations
     WHERE archived = 0
     ORDER BY LOWER(name)`
  ).all<{ id: string; name: string; slug: string; last_validated_year: number | null }>();

  const orgList = orgs ?? [];

  // Titulaires par org (1 query)
  const { results: titulaires } = await env.DB.prepare(
    `SELECT organization_id, email
     FROM users
     WHERE is_primary = 1 AND archived = 0`
  ).all<{ organization_id: string; email: string }>();
  const titulaireByOrg = new Map<string, string>();
  for (const t of titulaires ?? []) titulaireByOrg.set(t.organization_id, t.email);

  // Navires par org avec leur last_validated_year (1 query)
  const { results: vessels } = await env.DB.prepare(
    "SELECT organization_id, last_validated_year FROM organization_vessels"
  ).all<{ organization_id: string; last_validated_year: number | null }>();
  const vesselsByOrg = new Map<string, Array<{ last_validated_year: number | null }>>();
  for (const v of vessels ?? []) {
    const arr = vesselsByOrg.get(v.organization_id) ?? [];
    arr.push({ last_validated_year: v.last_validated_year });
    vesselsByOrg.set(v.organization_id, arr);
  }

  let orgsFullyValidated = 0;
  let totalVessels = 0;
  let validatedVessels = 0;

  const rows = orgList.map((o) => {
    const profileValidated = (o.last_validated_year ?? 0) >= targetYear;
    const orgVessels = vesselsByOrg.get(o.id) ?? [];
    const vTotal = orgVessels.length;
    const vValidated = orgVessels.filter((v) => (v.last_validated_year ?? 0) >= targetYear).length;
    totalVessels += vTotal;
    validatedVessels += vValidated;
    const fullyValidated = profileValidated && (vTotal === 0 || vValidated === vTotal);
    if (fullyValidated) orgsFullyValidated += 1;
    return {
      organizationId: o.id,
      organizationName: o.name,
      slug: o.slug,
      profileValidated,
      vesselsValidated: vValidated,
      vesselsTotal: vTotal,
      fullyValidated,
      titulaireEmail: titulaireByOrg.get(o.id) ?? null,
    };
  });

  return json({
    campaign: toFrontendCampaign(campaign),
    summary: {
      orgsTotal: orgList.length,
      orgsFullyValidated,
      vesselsValidated: validatedVessels,
      vesselsTotal: totalVessels,
    },
    rows,
  }, corsHeaders);
}

// ── GET /api/organizations/:slug/validations – historique compagnie ──
export async function handleListValidations(
  request: Request, env: Env, corsHeaders: Record<string, string>, slug: string,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  await ensureValidationTables(env);
  const org = await env.DB.prepare("SELECT id FROM organizations WHERE slug = ?")
    .bind(slug).first<{ id: string }>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  const allowed = await canActOnOrg(env, payload, org.id);
  if (!allowed) return json({ error: "Acces refuse" }, corsHeaders, 403);

  const { results } = await env.DB.prepare(
    `SELECT * FROM validation_history
     WHERE organization_id = ?
     ORDER BY target_year DESC, datetime(validated_at) DESC`
  ).bind(org.id).all<DbValidationHistory>();

  return json({
    organizationId: org.id,
    history: (results ?? []).map(toFrontendValidationHistory),
  }, corsHeaders);
}

// ── POST /api/organizations/:slug/validations – soumet N items atomiquement ──
export async function handleSubmitValidations(
  request: Request, env: Env, corsHeaders: Record<string, string>, slug: string,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  await ensureValidationTables(env);
  const org = await env.DB.prepare("SELECT * FROM organizations WHERE slug = ?")
    .bind(slug).first<DbOrganization>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  const allowed = await canActOnOrg(env, payload, org.id);
  if (!allowed) return json({ error: "Acces refuse" }, corsHeaders, 403);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  let items: ValidationRequestItem[];
  try { items = parseValidationItems(body.items); }
  catch (err) {
    if (err instanceof ValidationInputError) {
      return json({ error: err.message }, corsHeaders, 400);
    }
    throw err;
  }

  const openCampaign = await getOpenCampaign(env);
  const targetYear = resolveTargetYear(openCampaign);
  const campaignId = openCampaign?.id ?? null;
  const userId = String(payload.sub);
  const validatedAt = new Date().toISOString();

  // Profile updates : applique d'abord les changements sur la table organizations
  // pour que le snapshot reflete l'etat post-validation. Idem pour les navires.
  const stmts: ReturnType<typeof env.DB.prepare>[] = [];

  for (const item of items) {
    if (item.type === "profile") {
      // Si modification, applique les UPDATE sur organizations
      if (!item.unchanged && item.data) {
        const fieldMap: Record<string, string> = {
          email: "email",
          phone: "phone",
          address: "address",
          websiteUrl: "website_url",
          logoUrl: "logo_url",
          description: "description",
          employeeCount: "employee_count",
          shipCount: "ship_count",
        };
        const updates: string[] = [];
        const values: unknown[] = [];
        for (const [k, col] of Object.entries(fieldMap)) {
          if (k in item.data) {
            updates.push(`${col} = ?`);
            values.push(item.data[k] ?? null);
          }
        }
        if (updates.length > 0) {
          updates.push("updated_at = datetime('now')");
          values.push(org.id);
          stmts.push(env.DB.prepare(
            `UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`
          ).bind(...values));
        }
      }
    } else {
      // vessel : id obligatoire (deja valide par parseValidationItems)
      const vesselId = item.id!;
      if (!item.unchanged && item.data) {
        const fieldMap: Record<string, string> = {
          name: "name",
          imo: "imo",
          type: "type",
          flag: "flag",
          imageUrl: "image_url",
          yearBuilt: "year_built",
          length: "length_m",
          beam: "beam_m",
          grossTonnage: "gross_tonnage",
          passengerCapacity: "passenger_capacity",
          vehicleCapacity: "vehicle_capacity",
          freightCapacity: "freight_capacity",
          cruiseSpeed: "cruise_speed",
          rotationsPerYear: "rotations_per_year",
          crewSize: "crew_size",
          powerKw: "power_kw",
          consumptionPerTrip: "consumption_per_trip",
          renewalType: "renewal_type",
          renewalYear: "renewal_year",
          owner: "owner",
          shipyard: "shipyard",
          shipyardCountry: "shipyard_country",
          propulsionType: "propulsion_type",
          fuelType: "fuel_type",
          altFuelTests: "alt_fuel_tests",
          shorePower: "shore_power",
          hullTreatment: "hull_treatment",
          emissionReduction: "emission_reduction",
        };
        const updates: string[] = [];
        const values: unknown[] = [];
        for (const [k, col] of Object.entries(fieldMap)) {
          if (k in item.data) {
            updates.push(`${col} = ?`);
            values.push(item.data[k] ?? null);
          }
        }
        if ("crewByBrevet" in item.data) {
          const cbb = item.data.crewByBrevet;
          let cbbJson: string | null = null;
          if (cbb && typeof cbb === "object" && !Array.isArray(cbb)) {
            const cleaned = Object.fromEntries(
              Object.entries(cbb as Record<string, unknown>)
                .map(([k, v]) => {
                  const n = typeof v === "number" ? v : Number(v);
                  return [k, Number.isFinite(n) && n > 0 ? Math.floor(n) : 0];
                })
                .filter(([, n]) => (n as number) > 0),
            );
            if (Object.keys(cleaned).length > 0) cbbJson = JSON.stringify(cleaned);
          }
          updates.push("crew_by_brevet = ?");
          values.push(cbbJson);
        }
        if (updates.length > 0) {
          updates.push("updated_at = datetime('now')");
          values.push(vesselId, org.id);
          stmts.push(env.DB.prepare(
            `UPDATE organization_vessels SET ${updates.join(", ")} WHERE id = ? AND organization_id = ?`
          ).bind(...values));
        }
      }
    }
  }

  // Apply UPDATEs first so the snapshots can read post-update state
  if (stmts.length > 0) {
    await env.DB.batch(stmts);
  }

  // Re-read post-update org and vessels for snapshots
  const orgPostUpdate = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?")
    .bind(org.id).first<DbOrganization>();

  const vesselIds = items.filter((i) => i.type === "vessel").map((i) => i.id!);
  const vesselsById = new Map<string, DbVessel>();
  if (vesselIds.length > 0) {
    const placeholders = vesselIds.map(() => "?").join(",");
    const { results: vRows } = await env.DB.prepare(
      `SELECT * FROM organization_vessels WHERE organization_id = ? AND id IN (${placeholders})`
    ).bind(org.id, ...vesselIds).all<DbVessel>();
    for (const v of vRows ?? []) vesselsById.set(v.id, v);
  }

  // Build history INSERTs + last_validated_* UPDATEs in a second batch
  const historyStmts: ReturnType<typeof env.DB.prepare>[] = [];
  let validatedCount = 0;

  for (const item of items) {
    if (item.type === "profile") {
      const snapshot = orgPostUpdate ? buildProfileSnapshot(orgPostUpdate) : buildProfileSnapshot({});
      historyStmts.push(env.DB.prepare(
        `INSERT INTO validation_history
         (organization_id, item_type, item_id, target_year, validated_at,
          validated_by_user_id, snapshot_json, is_unchanged, campaign_id)
         VALUES (?, 'profile', NULL, ?, ?, ?, ?, ?, ?)`
      ).bind(
        org.id, targetYear, validatedAt, userId,
        JSON.stringify(snapshot), item.unchanged ? 1 : 0, campaignId,
      ));
      historyStmts.push(env.DB.prepare(
        `UPDATE organizations
         SET last_validated_year = ?, last_validated_at = ?, last_validated_by = ?
         WHERE id = ?`
      ).bind(targetYear, validatedAt, userId, org.id));
      validatedCount += 1;
    } else {
      const vesselRow = vesselsById.get(item.id!);
      if (!vesselRow) continue; // navire introuvable, on skip silencieusement
      const snapshot = buildVesselSnapshot(vesselRow);
      historyStmts.push(env.DB.prepare(
        `INSERT INTO validation_history
         (organization_id, item_type, item_id, target_year, validated_at,
          validated_by_user_id, snapshot_json, is_unchanged, campaign_id)
         VALUES (?, 'vessel', ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        org.id, item.id!, targetYear, validatedAt, userId,
        JSON.stringify(snapshot), item.unchanged ? 1 : 0, campaignId,
      ));
      historyStmts.push(env.DB.prepare(
        `UPDATE organization_vessels
         SET last_validated_year = ?, last_validated_at = ?, last_validated_by = ?
         WHERE id = ? AND organization_id = ?`
      ).bind(targetYear, validatedAt, userId, item.id!, org.id));
      validatedCount += 1;
    }
  }

  if (historyStmts.length > 0) {
    await env.DB.batch(historyStmts);
  }

  return json({
    success: true,
    validated: validatedCount,
    targetYear,
    campaignId: campaignId ?? undefined,
  }, corsHeaders);
}

/**
 * Best-effort : envoie un email Brevo a chaque titulaire actif (is_primary=1)
 * pour annoncer l'ouverture d'une campagne de validation. Silencieux si
 * `BREVO_API_KEY` absent. Les erreurs reseau / Brevo ne font pas echouer le
 * caller (campaign update / create).
 *
 * Audience : tous les titulaires des organisations actives (archived = 0).
 * Le scope est volontairement large (pas de filtre college / 3228) car la
 * validation annuelle concerne TOUTES les compagnies adherentes.
 *
 * Format : email transactionnel charte GASPE (logo, gradient, CTA teal),
 * lien direct vers /espace-adherent/validation, mention de la deadline si
 * presente.
 */
async function notifyCampaignOpened(
  env: Env,
  campaign: DbCampaign,
): Promise<{ sent: number; skipped: number }> {
  if (!env.BREVO_API_KEY) {
    console.log("[validation] BREVO_API_KEY absent, notifyCampaignOpened skipped");
    return { sent: 0, skipped: 0 };
  }

  // Idempotence (session 51) : si l'email d'ouverture a deja ete envoye pour
  // cette campagne, on no-op. Permet a un PATCH draft->open->draft->open de
  // ne pas spammer les titulaires.
  if (await alreadySent(env, campaign.id, "opened")) {
    console.log(`[validation] notifyCampaignOpened deja envoye pour ${campaign.id}`);
    return { sent: 0, skipped: 0 };
  }

  // Recupere les titulaires actifs avec leur organisation
  const { results } = await env.DB.prepare(
    `SELECT u.id AS user_id, u.email, u.name,
            o.id AS org_id, o.name AS org_name, o.slug AS org_slug
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.is_primary = 1
       AND u.archived = 0
       AND o.archived = 0
       AND u.email IS NOT NULL
       AND u.email != ''`,
  ).all<{
    user_id: string;
    email: string;
    name: string;
    org_id: string;
    org_name: string;
    org_slug: string;
  }>();
  const recipients = results ?? [];
  if (recipients.length === 0) {
    console.log("[validation] notifyCampaignOpened : aucun destinataire eligible");
    return { sent: 0, skipped: 0 };
  }

  const targetDateStr = campaign.target_date
    ? new Date(campaign.target_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const subject = `Validation annuelle ${campaign.target_year} ouverte – ACF`;

  let sent = 0;
  let skipped = 0;
  // Sequentiel pour limiter le risque de rate-limit Brevo (100 req/sec).
  // En pratique, < 30 destinataires donc cout negligeable.
  for (const r of recipients) {
    const htmlContent = renderCampaignOpenedEmailHtml({
      userName: r.name,
      orgName: r.org_name,
      targetYear: campaign.target_year,
      targetDateStr,
      notes: campaign.notes,
    });
    try {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "ACF (ex-GASPE)", email: "ne-pas-repondre@gaspe.fr" },
          to: [{ email: r.email, name: r.name }],
          subject,
          htmlContent,
        }),
      });
      if (resp.ok) sent += 1;
      else {
        skipped += 1;
        console.warn(`[validation] Brevo a refuse ${r.email} : ${resp.status}`);
      }
    } catch (err) {
      skipped += 1;
      console.error(`[validation] echec envoi a ${r.email} :`, err);
    }
  }
  console.log(`[validation] notifyCampaignOpened : ${sent} envoyes, ${skipped} echoues`);
  await logEmailSent(env, campaign.id, "opened", sent, skipped);
  return { sent, skipped };
}

/**
 * Genere le HTML inline du mail "Validation annuelle ouverte". Charte GASPE
 * (logo + gradient teal + CTA). Sanitization des champs dynamiques via
 * `sanitize()` (helper existant en haut du fichier).
 */
function renderCampaignOpenedEmailHtml(params: {
  userName: string;
  orgName: string;
  targetYear: number;
  targetDateStr: string | null;
  notes: string | null;
}): string {
  const ctaUrl = `${SITE_URL}/espace-adherent/validation`;
  const deadlineLine = params.targetDateStr
    ? `<p style="margin:0 0 12px;color:#222221;font-size:15px;">Deadline indicative : <strong>${sanitize(params.targetDateStr)}</strong>.</p>`
    : "";
  const notesLine = params.notes
    ? `<p style="margin:0 0 12px;color:#555;font-size:14px;font-style:italic;">${sanitize(params.notes)}</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:24px;">ACF (ex-GASPE)</h1>
      <p style="margin:4px 0 0;color:#B2DFE3;font-size:13px;">Localement ancres. Socialement engages.</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Validation annuelle ${params.targetYear} ouverte</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${sanitize(params.userName)},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">
        La campagne de validation annuelle <strong>${params.targetYear}</strong> vient d'etre ouverte par l'administration ACF. En tant que titulaire de la compagnie <strong>${sanitize(params.orgName)}</strong>, il vous est demande de confirmer ou de mettre a jour les donnees de votre profil et de votre flotte.
      </p>
      ${deadlineLine}
      ${notesLine}
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">
        Le processus est rapide : pour chaque element (profil + chaque navire), vous pouvez cocher « Inchange depuis l'an dernier » ou modifier les valeurs. La validation se fait en un seul clic.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:#1B7E8A;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;font-weight:600;">Valider mes donnees ${params.targetYear}</a>
      </div>
      <p style="margin:0 0 8px;color:#777;font-size:12px;">Vous pouvez aussi acceder directement a votre espace adherent puis cliquer sur la banniere « Validation annuelle ».</p>
      <p style="margin:0;color:#777;font-size:12px;">Une question ? Repondez a cet email ou contactez l'equipe ACF.</p>
    </div>
    <div style="background:#F5F3F0;padding:16px 32px;text-align:center;color:#777;font-size:11px;">
      ACF - Armateurs Cotiers Francais (ex-GASPE) - <a href="https://gaspe-fr.pages.dev" style="color:#1B7E8A;text-decoration:none;">gaspe-fr.pages.dev</a>
    </div>
  </div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════
//  Cron deadline notifications – J-14 / J+0 (session 51)
//  Declenche par scheduled() via Cloudflare Workers Cron Trigger.
//  Idempotent via la table validation_email_sent (UNIQUE par
//  campaign_id + notification_type, migration 0030).
// ═══════════════════════════════════════════════════════════

async function ensureEmailSentTable(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS validation_email_sent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      notification_type TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      recipients_count INTEGER NOT NULL DEFAULT 0,
      recipients_skipped INTEGER NOT NULL DEFAULT 0,
      UNIQUE(campaign_id, notification_type)
    )`).run();
  } catch { /* tables peut exister deja */ }
}

/**
 * Vrai si l'email correspondant a deja ete envoye pour cette campagne et
 * ce type de notification (idempotence cross-runs).
 */
async function alreadySent(
  env: Env,
  campaignId: number,
  type: "opened" | "due_soon" | "overdue",
): Promise<boolean> {
  await ensureEmailSentTable(env);
  const row = await env.DB.prepare(
    "SELECT id FROM validation_email_sent WHERE campaign_id = ? AND notification_type = ?",
  ).bind(campaignId, type).first<{ id: number }>();
  return !!row;
}

async function logEmailSent(
  env: Env,
  campaignId: number,
  type: "opened" | "due_soon" | "overdue",
  sent: number,
  skipped: number,
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO validation_email_sent
       (campaign_id, notification_type, recipients_count, recipients_skipped)
       VALUES (?, ?, ?, ?)`,
    ).bind(campaignId, type, sent, skipped).run();
  } catch (err) {
    console.error("[cron] logEmailSent failed:", err);
  }
}

/**
 * Recupere les organisations qui n'ont pas encore tout valide pour une annee
 * cible, avec leur titulaire actif (is_primary=1, archived=0, email non null).
 * Utilise par les helpers notifyCampaignDueSoon / notifyCampaignOverdue pour
 * cibler les retardataires uniquement.
 */
async function getNonValidatedRecipients(
  env: Env,
  targetYear: number,
): Promise<Array<{
  email: string;
  name: string;
  org_name: string;
  org_slug: string;
}>> {
  // Une org est "non fully validated" si :
  // - profil non valide pour targetYear (organizations.last_validated_year < targetYear OU NULL)
  // - OU au moins 1 navire non valide pour targetYear
  // On capture toutes les orgs et on filtre ensuite via les snapshots.
  const { results } = await env.DB.prepare(
    `SELECT u.email, u.name, o.id AS org_id, o.name AS org_name, o.slug AS org_slug,
            o.last_validated_year AS profile_year
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.is_primary = 1
       AND u.archived = 0
       AND o.archived = 0
       AND u.email IS NOT NULL
       AND u.email != ''`,
  ).all<{
    email: string;
    name: string;
    org_id: string;
    org_name: string;
    org_slug: string;
    profile_year: number | null;
  }>();
  const orgs = results ?? [];
  if (orgs.length === 0) return [];

  // Pour chaque org, verifier si tous ses navires ont last_validated_year >= targetYear
  const orgIds = orgs.map((o) => o.org_id);
  const placeholders = orgIds.map(() => "?").join(",");
  const { results: vesselRows } = await env.DB.prepare(
    `SELECT organization_id, last_validated_year
     FROM organization_vessels
     WHERE organization_id IN (${placeholders})`,
  ).bind(...orgIds).all<{
    organization_id: string;
    last_validated_year: number | null;
  }>();
  const vesselsByOrg = new Map<string, Array<{ last_validated_year: number | null }>>();
  for (const v of vesselRows ?? []) {
    const arr = vesselsByOrg.get(v.organization_id) ?? [];
    arr.push({ last_validated_year: v.last_validated_year });
    vesselsByOrg.set(v.organization_id, arr);
  }

  return orgs
    .filter((o) => {
      const profileOk = (o.profile_year ?? 0) >= targetYear;
      const vessels = vesselsByOrg.get(o.org_id) ?? [];
      const allVesselsOk = vessels.every((v) => (v.last_validated_year ?? 0) >= targetYear);
      return !profileOk || !allVesselsOk;
    })
    .map(({ email, name, org_name, org_slug }) => ({ email, name, org_name, org_slug }));
}

/**
 * Envoi des emails J-14 deadline approche aux retardataires d'une campagne.
 * Idempotent : no-op si deja envoye pour cette campagne. Best-effort sur Brevo.
 */
async function notifyCampaignDueSoon(env: Env, campaign: DbCampaign): Promise<void> {
  if (!env.BREVO_API_KEY) return;
  if (await alreadySent(env, campaign.id, "due_soon")) {
    console.log(`[cron] due_soon deja envoye pour campagne ${campaign.id}`);
    return;
  }
  const recipients = await getNonValidatedRecipients(env, campaign.target_year);
  if (recipients.length === 0) {
    console.log(`[cron] due_soon : aucun retardataire pour campagne ${campaign.id}`);
    await logEmailSent(env, campaign.id, "due_soon", 0, 0);
    return;
  }
  const targetDateStr = campaign.target_date
    ? new Date(campaign.target_date).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;
  const subject = `Validation annuelle ${campaign.target_year} – deadline approche`;
  let sent = 0;
  let skipped = 0;
  for (const r of recipients) {
    const html = renderCampaignDeadlineEmailHtml({
      kind: "due_soon",
      userName: r.name,
      orgName: r.org_name,
      targetYear: campaign.target_year,
      targetDateStr,
    });
    try {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "ACF (ex-GASPE)", email: "ne-pas-repondre@gaspe.fr" },
          to: [{ email: r.email, name: r.name }],
          subject,
          htmlContent: html,
        }),
      });
      if (resp.ok) sent += 1;
      else { skipped += 1; console.warn(`[cron] due_soon Brevo refus ${r.email} : ${resp.status}`); }
    } catch (err) {
      skipped += 1;
      console.error(`[cron] due_soon echec envoi a ${r.email}:`, err);
    }
  }
  console.log(`[cron] due_soon campagne ${campaign.id} : ${sent} envoyes, ${skipped} echoues`);
  await logEmailSent(env, campaign.id, "due_soon", sent, skipped);
}

/**
 * Envoi des emails J+0 deadline atteinte aux retardataires (apres deadline,
 * dans la fenetre de tolerance graceDays definie cote shouldNotifyOverdue).
 */
async function notifyCampaignOverdue(env: Env, campaign: DbCampaign): Promise<void> {
  if (!env.BREVO_API_KEY) return;
  if (await alreadySent(env, campaign.id, "overdue")) {
    console.log(`[cron] overdue deja envoye pour campagne ${campaign.id}`);
    return;
  }
  const recipients = await getNonValidatedRecipients(env, campaign.target_year);
  if (recipients.length === 0) {
    await logEmailSent(env, campaign.id, "overdue", 0, 0);
    return;
  }
  const targetDateStr = campaign.target_date
    ? new Date(campaign.target_date).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;
  const subject = `Validation annuelle ${campaign.target_year} – deadline atteinte`;
  let sent = 0;
  let skipped = 0;
  for (const r of recipients) {
    const html = renderCampaignDeadlineEmailHtml({
      kind: "overdue",
      userName: r.name,
      orgName: r.org_name,
      targetYear: campaign.target_year,
      targetDateStr,
    });
    try {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "ACF (ex-GASPE)", email: "ne-pas-repondre@gaspe.fr" },
          to: [{ email: r.email, name: r.name }],
          subject,
          htmlContent: html,
        }),
      });
      if (resp.ok) sent += 1;
      else { skipped += 1; console.warn(`[cron] overdue Brevo refus ${r.email} : ${resp.status}`); }
    } catch (err) {
      skipped += 1;
      console.error(`[cron] overdue echec envoi a ${r.email}:`, err);
    }
  }
  console.log(`[cron] overdue campagne ${campaign.id} : ${sent} envoyes, ${skipped} echoues`);
  await logEmailSent(env, campaign.id, "overdue", sent, skipped);
}

/**
 * Template HTML pour les emails deadline (due_soon / overdue). Charte ACF
 * (gradient teal pour due_soon, rouge soutenu pour overdue), sanitization
 * via le helper `sanitize()` existant.
 */
function renderCampaignDeadlineEmailHtml(params: {
  kind: "due_soon" | "overdue";
  userName: string;
  orgName: string;
  targetYear: number;
  targetDateStr: string | null;
}): string {
  const ctaUrl = `${SITE_URL}/espace-adherent/validation`;
  const isOverdue = params.kind === "overdue";
  const headerColor = isOverdue ? "#B91C1C" : "#1B7E8A";
  const headerBaseline = isOverdue ? "Action requise rapidement" : "Localement ancres. Socialement engages.";
  const title = isOverdue
    ? `Validation annuelle ${params.targetYear} : deadline atteinte`
    : `Validation annuelle ${params.targetYear} : deadline approche`;
  const intro = isOverdue
    ? `La date limite indicative pour valider vos donnees ${params.targetYear} (${params.targetDateStr ?? "?"}) est passee. Votre compagnie <strong>${sanitize(params.orgName)}</strong> n'a pas encore confirme l'integralite de son profil et de sa flotte.`
    : `La date limite indicative pour la validation annuelle ${params.targetYear} approche${params.targetDateStr ? ` (<strong>${sanitize(params.targetDateStr)}</strong>)` : ""}. Votre compagnie <strong>${sanitize(params.orgName)}</strong> n'a pas encore tout confirme.`;
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:${headerColor};padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:24px;">ACF (ex-GASPE)</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${headerBaseline}</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">${title}</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${sanitize(params.userName)},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">${intro}</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">
        Le processus est rapide : pour chaque element (profil + chaque navire), vous pouvez cocher « Inchange depuis l'an dernier » ou modifier les valeurs. La validation se fait en un seul clic.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:${headerColor};color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;font-weight:600;">Valider mes donnees ${params.targetYear}</a>
      </div>
      <p style="margin:0 0 8px;color:#777;font-size:12px;">Vous pouvez aussi acceder directement a votre espace adherent puis cliquer sur la banniere « Validation annuelle ».</p>
      <p style="margin:0;color:#777;font-size:12px;">Une question ? Repondez a cet email ou contactez l'equipe ACF.</p>
    </div>
    <div style="background:#F5F3F0;padding:16px 32px;text-align:center;color:#777;font-size:11px;">
      ACF - Armateurs Cotiers Francais (ex-GASPE) - <a href="https://gaspe-fr.pages.dev" style="color:${headerColor};text-decoration:none;">gaspe-fr.pages.dev</a>
    </div>
  </div>
</body></html>`;
}

/**
 * Entry point du cron quotidien (scheduled). Scan toutes les campagnes en
 * status='open', pour chaque on calcule shouldNotifyDueSoon / shouldNotifyOverdue
 * et on declenche l'email approprie. Idempotence garantie par la table
 * validation_email_sent (UNIQUE par campagne + type).
 */
export async function runValidationDeadlineCron(env: Env): Promise<void> {
  await ensureValidationTables(env);
  await ensureEmailSentTable(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE status = 'open'",
  ).all<DbCampaign>();
  const openCampaigns = results ?? [];
  console.log(`[cron] ${openCampaigns.length} campagne(s) ouverte(s) a scanner`);
  const nowMs = Date.now();
  for (const c of openCampaigns) {
    const cell: Pick<ValidationCampaignRow, "status" | "target_date"> = {
      status: c.status,
      target_date: c.target_date,
    };
    if (shouldNotifyOverdue(cell, nowMs)) {
      await notifyCampaignOverdue(env, c).catch((err) => {
        console.error(`[cron] notifyCampaignOverdue ${c.id} failed:`, err);
      });
    } else if (shouldNotifyDueSoon(cell, nowMs)) {
      await notifyCampaignDueSoon(env, c).catch((err) => {
        console.error(`[cron] notifyCampaignDueSoon ${c.id} failed:`, err);
      });
    }
  }
}