/**
 * Génère un snapshot SQL canonique de FLEET_SEED dans
 * `scripts/_canonical-fleet-seed.snapshot.sql`.
 *
 * IMPORTANT : 0013_seed_organization_vessels.sql est une migration immutable
 * déjà appliquée en prod (110 navires). Toute évolution de fleet-seed.ts
 * doit faire l'objet d'une migration delta dédiée (ex : 0015_seed_jalilo.sql)
 * — ce script ne touche plus aux migrations.
 *
 * Le snapshot sert de référence pour vérifier que fleet-seed.ts est cohérent
 * avec ce qui finira en base après application de toutes les migrations.
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

function generate(totalCompanies: number, totalVessels: number): string {
  const lines: string[] = [];
  lines.push("-- _canonical-fleet-seed.snapshot.sql");
  lines.push("-- SNAPSHOT auto-généré – PAS UNE MIGRATION (extension .snapshot.sql).");
  lines.push(`-- État courant de FLEET_SEED : ${totalVessels} navires sur ${totalCompanies} compagnies.`);
  lines.push("-- Référence pour audit cohérence DB ↔ seed éditorial.");
  lines.push("-- Idempotent : INSERT OR IGNORE + ids stables.");
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

const totalCompanies = Object.keys(FLEET_SEED).length;
const totalVessels = Object.values(FLEET_SEED).reduce((sum, list) => sum + list.length, 0);
const outPath = resolve(process.cwd(), "scripts/_canonical-fleet-seed.snapshot.sql");
writeFileSync(outPath, generate(totalCompanies, totalVessels), "utf-8");
console.log(`Written ${outPath} – ${totalVessels} vessels / ${totalCompanies} companies`);
