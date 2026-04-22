/**
 * Génère workers/migrations/0013_seed_organization_vessels.sql à partir de
 * src/data/fleet-seed.ts. Idempotent : INSERT OR IGNORE avec `id` stable.
 *
 * Usage : npx tsx scripts/build-fleet-seed-sql.ts
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { FLEET_SEED } from "../src/data/fleet-seed";
import type { FleetVessel } from "../src/types";

function sqlEscape(val: unknown): string {
  if (val === undefined || val === null || val === "") return "NULL";
  if (typeof val === "number") return Number.isFinite(val) ? String(val) : "NULL";
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

function emitInsert(slug: string, v: FleetVessel): string {
  const cols = [
    "id",
    "organization_id",
    "name",
    "imo",
    "type",
    "operating_line",
    "flag",
    "image_url",
    "year_built",
    "length_m",
    "beam_m",
    "gross_tonnage",
    "passenger_capacity",
    "vehicle_capacity",
    "freight_capacity",
    "cruise_speed",
    "rotations_per_year",
    "crew_size",
    "power_kw",
    "consumption_per_trip",
    "renewal_type",
    "renewal_year",
    "owner",
    "shipyard",
    "shipyard_country",
    "propulsion_type",
    "fuel_type",
    "alt_fuel_tests",
    "shore_power",
    "hull_treatment",
    "emission_reduction",
  ];

  const values = [
    sqlEscape(v.id),
    `(SELECT id FROM organizations WHERE slug = '${slug.replace(/'/g, "''")}')`,
    sqlEscape(v.name),
    sqlEscape(v.imo),
    sqlEscape(v.type),
    sqlEscape(v.operatingLine),
    sqlEscape(v.flag),
    sqlEscape(v.imageUrl),
    sqlEscape(v.yearBuilt),
    sqlEscape(v.length),
    sqlEscape(v.beam),
    sqlEscape(v.grossTonnage),
    sqlEscape(v.passengerCapacity),
    sqlEscape(v.vehicleCapacity),
    sqlEscape(v.freightCapacity),
    sqlEscape(v.cruiseSpeed),
    sqlEscape(v.rotationsPerYear),
    sqlEscape(v.crewSize),
    sqlEscape(v.powerKw),
    sqlEscape(v.consumptionPerTrip),
    sqlEscape(v.renewalType),
    sqlEscape(v.renewalYear),
    sqlEscape(v.owner),
    sqlEscape(v.shipyard),
    sqlEscape(v.shipyardCountry),
    sqlEscape(v.propulsionType),
    sqlEscape(v.fuelType),
    sqlEscape(v.altFuelTests),
    sqlEscape(v.shorePower),
    sqlEscape(v.hullTreatment),
    sqlEscape(v.emissionReduction),
  ];

  return `INSERT OR IGNORE INTO organization_vessels (${cols.join(", ")}) VALUES (${values.join(", ")});`;
}

function generate(): string {
  const lines: string[] = [];
  lines.push("-- 0013_seed_organization_vessels.sql");
  lines.push("-- Seed initial de la flotte détaillée par compagnie adhérente.");
  lines.push("-- Source : src/data/fleet-seed.ts (110 navires, 25 compagnies).");
  lines.push("-- Généré par scripts/build-fleet-seed-sql.ts — NE PAS ÉDITER À LA MAIN.");
  lines.push("-- Idempotent : INSERT OR IGNORE + ids stables (réapplicable sans doublon).");
  lines.push("-- L'organization_id est résolu via sous-requête sur slug → pas de couplage");
  lines.push("-- à l'id numérique auto-généré.");
  lines.push("");

  let total = 0;
  for (const [slug, vessels] of Object.entries(FLEET_SEED)) {
    lines.push(`-- ${slug} (${vessels.length} navire${vessels.length > 1 ? "s" : ""})`);
    for (const v of vessels) {
      lines.push(emitInsert(slug, v));
      total++;
    }
    lines.push("");
  }

  lines.push(`-- Total : ${total} navires insérés sur ${Object.keys(FLEET_SEED).length} compagnies.`);
  lines.push("");
  return lines.join("\n");
}

const outPath = resolve(process.cwd(), "workers/migrations/0013_seed_organization_vessels.sql");
writeFileSync(outPath, generate(), "utf-8");
console.log(`Written ${outPath}`);
