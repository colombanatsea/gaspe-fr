/**
 * Handlers flotte par organisation (table organization_vessels, migration
 * 0012). GET public, PUT admin OU même org (atomic replace).
 *
 * Le module exporte `DbVessel`, `toFrontendVessel`, `ensureVesselsTable`
 * pour les handlers validation-campaigns (qui lisent une flotte projetée).
 *
 * Extrait de `workers/api.ts` en J1 vague 6.b.
 */

import { json } from "../lib/json";
import { requireJwt } from "../lib/auth";
import { numOrNull, strOrNull } from "../lib/db-helpers";
import type { Env } from "../lib/env";

export interface DbVessel {
  id: string;
  organization_id: string;
  name: string;
  imo: string | null;
  type: string | null;
  operating_line: string | null;
  flag: string | null;
  image_url: string | null;
  year_built: number | null;
  length_m: number | null;
  beam_m: number | null;
  gross_tonnage: number | null;
  passenger_capacity: number | null;
  vehicle_capacity: number | null;
  freight_capacity: number | null;
  cruise_speed: number | null;
  rotations_per_year: number | null;
  crew_size: string | null;
  power_kw: string | null;
  consumption_per_trip: string | null;
  renewal_type: string | null;
  renewal_year: string | null;
  owner: string | null;
  shipyard: string | null;
  shipyard_country: string | null;
  propulsion_type: string | null;
  fuel_type: string | null;
  alt_fuel_tests: string | null;
  shore_power: string | null;
  hull_treatment: string | null;
  emission_reduction: string | null;
  crew_by_brevet: string | null;
}

export function toFrontendVessel(row: DbVessel) {
  let crewByBrevet: Record<string, number> | undefined;
  if (row.crew_by_brevet) {
    try {
      const parsed = JSON.parse(row.crew_by_brevet);
      if (parsed && typeof parsed === "object") {
        crewByBrevet = Object.fromEntries(
          Object.entries(parsed)
            .filter(([, v]) => typeof v === "number" && Number.isFinite(v) && v > 0)
            .map(([k, v]) => [k, Math.floor(v as number)]),
        );
        if (Object.keys(crewByBrevet).length === 0) crewByBrevet = undefined;
      }
    } catch { /* malformed JSON – ignore */ }
  }
  return {
    id: row.id,
    name: row.name,
    imo: row.imo ?? undefined,
    type: row.type ?? undefined,
    operatingLine: row.operating_line ?? undefined,
    flag: row.flag ?? undefined,
    imageUrl: row.image_url ?? undefined,
    yearBuilt: row.year_built ?? undefined,
    length: row.length_m ?? undefined,
    beam: row.beam_m ?? undefined,
    grossTonnage: row.gross_tonnage ?? undefined,
    passengerCapacity: row.passenger_capacity ?? undefined,
    vehicleCapacity: row.vehicle_capacity ?? undefined,
    freightCapacity: row.freight_capacity ?? undefined,
    cruiseSpeed: row.cruise_speed ?? undefined,
    rotationsPerYear: row.rotations_per_year ?? undefined,
    crewSize: row.crew_size ?? undefined,
    powerKw: row.power_kw ?? undefined,
    consumptionPerTrip: row.consumption_per_trip ?? undefined,
    renewalType: row.renewal_type ?? undefined,
    renewalYear: row.renewal_year ?? undefined,
    owner: row.owner ?? undefined,
    shipyard: row.shipyard ?? undefined,
    shipyardCountry: row.shipyard_country ?? undefined,
    propulsionType: row.propulsion_type ?? undefined,
    fuelType: row.fuel_type ?? undefined,
    altFuelTests: row.alt_fuel_tests ?? undefined,
    shorePower: row.shore_power ?? undefined,
    hullTreatment: row.hull_treatment ?? undefined,
    emissionReduction: row.emission_reduction ?? undefined,
    crewByBrevet,
  };
}

/** Ensure the vessels table exists (defensive, in case migration lags). */
export async function ensureVesselsTable(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS organization_vessels (
      id TEXT PRIMARY KEY,
      organization_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      imo TEXT, type TEXT, operating_line TEXT, flag TEXT, image_url TEXT,
      year_built INTEGER, length_m REAL, beam_m REAL, gross_tonnage REAL,
      passenger_capacity INTEGER, vehicle_capacity INTEGER, freight_capacity INTEGER,
      cruise_speed REAL, rotations_per_year INTEGER,
      crew_size TEXT, power_kw TEXT, consumption_per_trip TEXT,
      renewal_type TEXT, renewal_year TEXT,
      owner TEXT, shipyard TEXT, shipyard_country TEXT,
      propulsion_type TEXT, fuel_type TEXT,
      alt_fuel_tests TEXT, shore_power TEXT, hull_treatment TEXT, emission_reduction TEXT,
      crew_by_brevet TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_org_vessels_org ON organization_vessels(organization_id)").run();
  } catch {
    /* ignore – table may already exist */
  }
}

/** GET /api/organizations/:slug/fleet – public. */
export async function handleGetFleet(
  _request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
) {
  await ensureVesselsTable(env);
  const org = await env.DB.prepare("SELECT id FROM organizations WHERE slug = ?")
    .bind(slug)
    .first<{ id: string }>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  const { results } = await env.DB.prepare(
    "SELECT * FROM organization_vessels WHERE organization_id = ? ORDER BY LOWER(name)",
  ).bind(org.id).all<DbVessel>();

  return json({ vessels: (results ?? []).map(toFrontendVessel) }, corsHeaders);
}

/**
 * GET /api/organizations/fleet
 * Vue agrégée de toutes les flottes par compagnie.
 * Auth : tout adhérent authentifié (le gating "completeness 100%" est
 * appliqué côté frontend via /espace-adherent/annuaire-flotte). L'admin
 * peut aussi appeler. Le candidat ou l'utilisateur non authentifié ne
 * peut pas accéder.
 */
export async function handleListAllFleets(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;
  if (payload.role !== "admin" && payload.role !== "adherent") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await ensureVesselsTable(env);
  const { results } = await env.DB.prepare(
    `SELECT v.*, o.slug AS org_slug
     FROM organization_vessels v
     JOIN organizations o ON o.id = v.organization_id
     ORDER BY o.slug, LOWER(v.name)`,
  ).all<DbVessel & { org_slug: string }>();

  const fleets: Record<string, ReturnType<typeof toFrontendVessel>[]> = {};
  for (const row of results ?? []) {
    const bucket = fleets[row.org_slug] ?? (fleets[row.org_slug] = []);
    bucket.push(toFrontendVessel(row));
  }
  return json({ fleets }, corsHeaders);
}

/**
 * PUT /api/organizations/:slug/fleet
 * Body : { vessels: FleetVessel[] }
 * Auth : admin OR user.organization_id === org.id
 * Comportement : remplace atomiquement la flotte complète de l'organisation.
 */
export async function handleUpsertFleet(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  await ensureVesselsTable(env);
  const org = await env.DB.prepare("SELECT id FROM organizations WHERE slug = ?")
    .bind(slug)
    .first<{ id: string }>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  // Ownership : admin OR member of the same organization
  if (payload.role !== "admin") {
    const user = await env.DB.prepare("SELECT organization_id FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ organization_id: string | null }>();
    if (!user || user.organization_id !== org.id) {
      return json({ error: "Accès refusé" }, corsHeaders, 403);
    }
  }

  let body: { vessels?: unknown };
  try {
    body = (await request.json()) as { vessels?: unknown };
  } catch {
    return json({ error: "Body JSON invalide" }, corsHeaders, 400);
  }
  if (!Array.isArray(body.vessels)) {
    return json({ error: "Champ 'vessels' manquant ou invalide" }, corsHeaders, 400);
  }
  const vessels = body.vessels as Array<Record<string, unknown>>;

  // Atomic replace : delete existing vessels + insert new list.
  const stmts = [
    env.DB.prepare("DELETE FROM organization_vessels WHERE organization_id = ?").bind(org.id),
  ];
  for (const v of vessels) {
    const name = typeof v.name === "string" ? v.name.trim() : "";
    if (!name) continue; // skip unnamed entries
    const id = typeof v.id === "string" && v.id.length > 0
      ? v.id
      : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    // Sérialisation JSON propre de crewByBrevet (ne stocke que les paires > 0)
    let crewByBrevetJson: string | null = null;
    if (v.crewByBrevet && typeof v.crewByBrevet === "object") {
      const cleaned = Object.fromEntries(
        Object.entries(v.crewByBrevet as Record<string, unknown>)
          .map(([k, val]) => {
            const n = typeof val === "number" ? val : Number(val);
            return [k, Number.isFinite(n) && n > 0 ? Math.floor(n) : 0];
          })
          .filter(([, n]) => (n as number) > 0),
      );
      if (Object.keys(cleaned).length > 0) crewByBrevetJson = JSON.stringify(cleaned);
    }

    stmts.push(
      env.DB.prepare(
        `INSERT INTO organization_vessels (
          id, organization_id, name, imo, type, operating_line, flag, image_url,
          year_built, length_m, beam_m, gross_tonnage,
          passenger_capacity, vehicle_capacity, freight_capacity,
          cruise_speed, rotations_per_year,
          crew_size, power_kw, consumption_per_trip,
          renewal_type, renewal_year, owner, shipyard, shipyard_country,
          propulsion_type, fuel_type,
          alt_fuel_tests, shore_power, hull_treatment, emission_reduction,
          crew_by_brevet,
          created_by, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?,
          ?,
          ?, datetime('now')
        )`,
      ).bind(
        id,
        org.id,
        name,
        strOrNull(v.imo),
        strOrNull(v.type),
        strOrNull(v.operatingLine),
        strOrNull(v.flag),
        strOrNull(v.imageUrl),
        numOrNull(v.yearBuilt),
        numOrNull(v.length),
        numOrNull(v.beam),
        numOrNull(v.grossTonnage),
        numOrNull(v.passengerCapacity),
        numOrNull(v.vehicleCapacity),
        numOrNull(v.freightCapacity),
        numOrNull(v.cruiseSpeed),
        numOrNull(v.rotationsPerYear),
        strOrNull(v.crewSize),
        strOrNull(v.powerKw),
        strOrNull(v.consumptionPerTrip),
        strOrNull(v.renewalType),
        strOrNull(v.renewalYear),
        strOrNull(v.owner),
        strOrNull(v.shipyard),
        strOrNull(v.shipyardCountry),
        strOrNull(v.propulsionType),
        strOrNull(v.fuelType),
        strOrNull(v.altFuelTests),
        strOrNull(v.shorePower),
        strOrNull(v.hullTreatment),
        strOrNull(v.emissionReduction),
        crewByBrevetJson,
        String(payload.sub),
      ),
    );
  }

  await env.DB.batch(stmts);

  const { results } = await env.DB.prepare(
    "SELECT * FROM organization_vessels WHERE organization_id = ? ORDER BY LOWER(name)",
  ).bind(org.id).all<DbVessel>();

  return json({ success: true, vessels: (results ?? []).map(toFrontendVessel) }, corsHeaders);
}
