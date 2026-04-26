/**
 * Helpers CSV pour import/export de flotte.
 * Format : CSV UTF-8 avec BOM (compatible Excel français), séparateur `;`
 * (Excel FR par défaut), encodage des guillemets RFC 4180.
 *
 * Colonnes alignées 1:1 sur `FleetVessel` (sauf `id` réservé interne et
 * `crewByBrevet` qui devient une série de colonnes `equipage_<key>`).
 */

import type { FleetVessel, CrewBrevetKey } from "@/types";
import { CREW_BREVETS } from "@/types";

/** Colonnes principales — ordre canonique du template. */
const COLS_PRIMARY: Array<{ key: keyof FleetVessel; header: string }> = [
  { key: "name", header: "Nom du navire *" },
  { key: "imo", header: "Numéro IMO" },
  { key: "type", header: "Type" },
  { key: "operatingLine", header: "Ligne d'exploitation" },
  { key: "yearBuilt", header: "Année de construction" },
  { key: "length", header: "Longueur (m)" },
  { key: "beam", header: "Largeur (m)" },
  { key: "grossTonnage", header: "Jauge UMS" },
  { key: "passengerCapacity", header: "Capacité passagers" },
  { key: "vehicleCapacity", header: "Capacité véhicules" },
  { key: "freightCapacity", header: "Capacité fret (tonnes)" },
  { key: "cruiseSpeed", header: "Vitesse de croisière (nœuds)" },
  { key: "rotationsPerYear", header: "Rotations / an (2024)" },
  { key: "crewSize", header: "Équipage (texte libre)" },
  { key: "powerKw", header: "Puissance installée" },
  { key: "consumptionPerTrip", header: "Consommation par trajet" },
  { key: "fuelType", header: "Carburant principal" },
  { key: "propulsionType", header: "Type de propulsion" },
  { key: "renewalType", header: "Type de renouvellement" },
  { key: "renewalYear", header: "Année de renouvellement" },
  { key: "owner", header: "Propriétaire" },
  { key: "shipyard", header: "Chantier" },
  { key: "shipyardCountry", header: "Pays du chantier" },
  { key: "altFuelTests", header: "Tests carburants alternatifs" },
  { key: "shorePower", header: "Connexion à quai" },
  { key: "hullTreatment", header: "Antifouling" },
  { key: "emissionReduction", header: "Réduction émissions" },
  { key: "flag", header: "Pavillon" },
  { key: "imageUrl", header: "URL photo" },
];

/** Colonnes équipage (1 par brevet). */
const CREW_COLS: Array<{ key: CrewBrevetKey; header: string }> = CREW_BREVETS.map((b) => ({
  key: b.key,
  header: `Équipage – ${b.label}`,
}));

const SEP = ";";
const BOM = "﻿";

/** Échappe une valeur CSV (RFC 4180 + séparateur `;`). */
function escapeCsv(val: unknown): string {
  if (val === undefined || val === null) return "";
  const s = String(val);
  if (s.includes(SEP) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Génère le contenu CSV de template (1 ligne d'en-têtes + 1 ligne d'exemple
 * commentée). Utilisable comme téléchargement.
 */
export function buildFleetCsvTemplate(): string {
  const headers = [...COLS_PRIMARY.map((c) => c.header), ...CREW_COLS.map((c) => c.header)];
  const exampleRow = [
    "Le Bel Élan", "9876543", "Vedette à passagers", "Port → Île",
    "2018", "32.5", "8.2", "199", "200", "0", "0",
    "22", "1200", "5", "2 x 600 kW", "80", "GO", "Diesel-électrique",
    "Achat neuf", "2030", "Région Bretagne", "Piriou", "France",
    "Effectués", "Effective", "Effectif", "-30% NOx",
    "RIF", "https://exemple.fr/photo.jpg",
    // Équipage : 5 brevets renseignés en exemple
    "1", "2", "1", "0", "0", "0", "1", "0", "1", "0", "0", "0", "0", "0", "1", "0", "0",
  ];
  return BOM + headers.join(SEP) + "\n" + exampleRow.map(escapeCsv).join(SEP) + "\n";
}

/**
 * Parse un CSV (séparateur `;`, BOM UTF-8 toléré, RFC 4180).
 * Retourne la liste des navires extraits + les erreurs par ligne.
 */
export function parseFleetCsv(content: string): { vessels: FleetVessel[]; errors: string[] } {
  const errors: string[] = [];
  const vessels: FleetVessel[] = [];

  // Strip BOM
  let text = content;
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const lines = splitCsvLines(text);
  if (lines.length < 2) return { vessels, errors: ["CSV vide ou sans données."] };

  const headers = parseCsvRow(lines[0]);
  const headerToIndex = new Map<string, number>();
  headers.forEach((h, i) => headerToIndex.set(h.trim(), i));

  // Mapping header → key
  const colIndex: Map<string, number> = new Map();
  for (const c of COLS_PRIMARY) {
    const idx = headerToIndex.get(c.header);
    if (idx !== undefined) colIndex.set(c.key as string, idx);
  }
  for (const c of CREW_COLS) {
    const idx = headerToIndex.get(c.header);
    if (idx !== undefined) colIndex.set(`crew:${c.key}`, idx);
  }

  // Vérifie que `name` est présent
  if (!colIndex.has("name")) {
    errors.push(`Colonne "${COLS_PRIMARY[0].header}" obligatoire et introuvable.`);
    return { vessels, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (row.length === 0 || row.every((c) => c.trim() === "")) continue;

    const get = (key: string): string => {
      const idx = colIndex.get(key);
      return idx !== undefined && idx < row.length ? row[idx].trim() : "";
    };

    const name = get("name");
    if (!name) {
      errors.push(`Ligne ${i + 1} : colonne "Nom du navire" vide → ignorée.`);
      continue;
    }

    const numOrUndef = (s: string): number | undefined => {
      const t = s.replace(",", ".").trim();
      if (!t) return undefined;
      const n = Number(t);
      return Number.isFinite(n) ? n : undefined;
    };
    const strOrUndef = (s: string): string | undefined => {
      const t = s.trim();
      return t || undefined;
    };

    const vessel: FleetVessel = {
      name,
      imo: strOrUndef(get("imo")),
      type: strOrUndef(get("type")),
      operatingLine: strOrUndef(get("operatingLine")),
      yearBuilt: numOrUndef(get("yearBuilt")),
      length: numOrUndef(get("length")),
      beam: numOrUndef(get("beam")),
      grossTonnage: numOrUndef(get("grossTonnage")),
      passengerCapacity: numOrUndef(get("passengerCapacity")),
      vehicleCapacity: numOrUndef(get("vehicleCapacity")),
      freightCapacity: numOrUndef(get("freightCapacity")),
      cruiseSpeed: numOrUndef(get("cruiseSpeed")),
      rotationsPerYear: numOrUndef(get("rotationsPerYear")),
      crewSize: strOrUndef(get("crewSize")),
      powerKw: strOrUndef(get("powerKw")),
      consumptionPerTrip: strOrUndef(get("consumptionPerTrip")),
      fuelType: strOrUndef(get("fuelType")),
      propulsionType: strOrUndef(get("propulsionType")),
      renewalType: strOrUndef(get("renewalType")),
      renewalYear: strOrUndef(get("renewalYear")),
      owner: strOrUndef(get("owner")),
      shipyard: strOrUndef(get("shipyard")),
      shipyardCountry: strOrUndef(get("shipyardCountry")),
      altFuelTests: strOrUndef(get("altFuelTests")),
      shorePower: strOrUndef(get("shorePower")),
      hullTreatment: strOrUndef(get("hullTreatment")),
      emissionReduction: strOrUndef(get("emissionReduction")),
      flag: strOrUndef(get("flag")),
      imageUrl: strOrUndef(get("imageUrl")),
    };

    // Équipage par brevet
    const crewByBrevet: Partial<Record<CrewBrevetKey, number>> = {};
    for (const c of CREW_COLS) {
      const v = get(`crew:${c.key}`);
      const n = numOrUndef(v);
      if (n !== undefined && n > 0) crewByBrevet[c.key] = Math.floor(n);
    }
    if (Object.keys(crewByBrevet).length > 0) vessel.crewByBrevet = crewByBrevet;

    vessels.push(vessel);
  }

  return { vessels, errors };
}

/** Sépare un texte CSV en lignes en respectant les guillemets multi-lignes. */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      current += c;
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && text[i + 1] === "\n") i++; // CRLF
      if (current) lines.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Parse une ligne CSV en cellules (séparateur `;`, RFC 4180). */
function parseCsvRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === SEP && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells;
}

/** Déclenche le téléchargement du template CSV depuis le navigateur. */
export function downloadFleetTemplate(filename = "template-flotte-acf.csv"): void {
  if (typeof window === "undefined") return;
  const csv = buildFleetCsvTemplate();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
