#!/usr/bin/env tsx
/**
 * scripts/compute-seed-hashes.ts
 *
 * P2-1 du rapport docs/PRODUCTION-SAFETY-2026.md (lot G3, session 54+).
 *
 * Calcule les SHA-256 des fichiers de seed critiques et les affiche.
 * Sortie utilisable pour :
 *   1. Validation manuelle au moment d'une release (« ce seed a-t-il
 *      changé depuis la dernière fois ? »).
 *   2. POST vers /api/admin/seed-hashes pour enregistrer en D1
 *      (drift detection pour les déploiements suivants).
 *
 * Usage :
 *   npx tsx scripts/compute-seed-hashes.ts
 *
 * Variantes :
 *   --json   : sortie JSON sur stdout (pour pipe vers curl)
 *   --post   : POST automatique à /api/admin/seed-hashes (requiert
 *              ADMIN_TOKEN env + API_URL env)
 */

import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/**
 * Liste des seeds versionnés. Chaque entrée :
 *   - name : identifiant unique en D1
 *   - file : chemin relatif au repo
 *   - notes : description courte (audit lisible)
 */
const SEEDS = [
  { name: "members", file: "src/data/members.ts", notes: "30 adhérents (compagnies + experts)" },
  { name: "fleet-seed", file: "src/data/fleet-seed.ts", notes: "111 navires (110 + Jalilo)" },
  { name: "ccn3228", file: "src/data/ccn3228.ts", notes: "CCN 3228, NAO, ENIM, FAQ" },
  { name: "stcw", file: "src/data/stcw.ts", notes: "Brevets STCW" },
  { name: "ssgm", file: "src/data/ssgm.ts", notes: "SSGM 25 centres + 10 médecins" },
  { name: "schools", file: "src/data/schools.ts", notes: "Écoles maritimes (LPM + ENSM)" },
  { name: "career-salary", file: "src/data/career-salary.ts", notes: "Parcours carrière 4 voies" },
  { name: "formations", file: "src/data/formations.ts", notes: "Seed éditorial (D1 prime en prod)" },
  { name: "positions", file: "src/data/positions.ts", notes: "Seed éditorial (D1 prime en prod)" },
  { name: "cms-defaults", file: "src/data/cms-defaults.ts", notes: "Contenus CMS par défaut" },
];

interface SeedHash {
  name: string;
  file: string;
  sha256: string;
  byte_size: number;
  notes: string;
}

function hashFile(absolutePath: string): { sha256: string; byte_size: number } {
  const buf = readFileSync(absolutePath);
  const stat = statSync(absolutePath);
  const hash = createHash("sha256").update(buf).digest("hex");
  return { sha256: hash, byte_size: stat.size };
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const doPost = args.includes("--post");

  const results: SeedHash[] = [];
  for (const seed of SEEDS) {
    const abs = join(ROOT, seed.file);
    try {
      const { sha256, byte_size } = hashFile(abs);
      results.push({ name: seed.name, file: seed.file, sha256, byte_size, notes: seed.notes });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[seed-hashes] Erreur lecture ${seed.file}: ${msg}`);
    }
  }

  if (asJson) {
    process.stdout.write(JSON.stringify(results, null, 2));
    return;
  }

  // Sortie human-readable
  console.log("=== Hashes seeds (session courante) ===\n");
  for (const r of results) {
    console.log(`${r.name.padEnd(20)}  ${r.sha256}  ${String(r.byte_size).padStart(8)} B  ${r.file}`);
  }
  console.log(`\n${results.length} seeds calculés.\n`);

  if (doPost) {
    const apiUrl = process.env.API_URL || "https://gaspe-api.hello-0d0.workers.dev";
    const token = process.env.ADMIN_TOKEN;
    if (!token) {
      console.error("[seed-hashes] --post nécessite ADMIN_TOKEN env (cookie JWT admin)");
      process.exit(2);
    }
    const url = `${apiUrl}/api/admin/seed-hashes`;
    console.log(`POST ${url} avec ${results.length} entrées …`);
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `gaspe_token=${token}`,
      },
      body: JSON.stringify({ hashes: results }),
    })
      .then(async (res) => {
        const body = await res.text();
        console.log(`HTTP ${res.status}: ${body}`);
        if (!res.ok) process.exit(1);
      })
      .catch((err) => {
        console.error(`[seed-hashes] POST échoué: ${err}`);
        process.exit(1);
      });
  } else {
    console.log("Astuce : ajouter --post pour enregistrer en D1 (requiert ADMIN_TOKEN env)");
    console.log("Astuce : ajouter --json pour pipe vers curl ou autre");
  }
}

main();
