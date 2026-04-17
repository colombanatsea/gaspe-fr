/**
 * ENM Text Parsers — Parse copy-pasted content from the ENM portal
 *
 * The user logs into enm.mes-services.mer.gouv.fr via FranceConnect,
 * navigates to their data pages, and copies the content (Ctrl+A, Ctrl+C).
 * These parsers extract structured data from the pasted text.
 *
 * Pages parsed:
 *   - /fr/univers-marin/pmr/lignes-de-service
 *   - /fr/univers-marin/pmr/mes-titres
 *   - /fr/univers-marin/pmr/aptitude-medicale
 */

function parseFrenchDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  if (!d || !m || !y) return ddmmyyyy;
  return `${y}-${m}-${d}`;
}

export interface ParsedSeaService {
  id: string;
  vesselName: string;
  vesselImo: string;
  rank: string;
  category: string;
  startDate: string;
  endDate: string;
}

export interface ParsedCertificate {
  certId: string;
  title: string;
  enmReference: string;
  status: "valid" | "expired";
  expiryDate?: string;
}

export interface ParsedMedical {
  visitType?: string;
  lastVisitDate?: string;
  expiryDate?: string;
  decision?: string;
  duration?: string;
  restrictions: string[];
}

export interface ParsedEnmData {
  seaService: ParsedSeaService[];
  certificates: ParsedCertificate[];
  medical: ParsedMedical;
  enmMarinId?: string;
}

/** Try to parse tab-separated table rows (ENM portal table copy-paste) */
function parseTabSeparatedService(text: string): ParsedSeaService[] {
  const results: ParsedSeaService[] = [];
  const lines = text.split("\n").filter((l) => l.includes("\t") && /\d{2}\/\d{2}\/\d{4}/.test(l));
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split("\t").map((c) => c.trim());
    if (cols.length < 3) continue;
    const dateMatch = cols.join(" ").match(/(\d{2}\/\d{2}\/\d{4})\s*[-–]?\s*(\d{2}\/\d{2}\/\d{4})/);
    const imoMatch = cols.join(" ").match(/(\d{7})/);
    if (dateMatch) {
      results.push({
        id: `enm-tab-${Date.now()}-${i}`,
        startDate: parseFrenchDate(dateMatch[1]),
        endDate: parseFrenchDate(dateMatch[2]),
        vesselName: cols.find((c) => c.length > 3 && !/\d{2}\/\d{2}/.test(c) && !/^\d+$/.test(c)) ?? "Navire inconnu",
        vesselImo: imoMatch?.[1] ?? "",
        rank: cols.find((c) => /capitaine|matelot|lieutenant|officier|patron|mécanicien|mecanicien/i.test(c)) ?? "",
        category: cols.find((c) => /^[1-5]$/.test(c)) ?? "",
      });
    }
  }
  return results;
}

/** Parse sea service lines from pasted text */
export function parseSeaServiceText(text: string): ParsedSeaService[] {
  // Try tab-separated format first (direct table copy)
  const tabResults = parseTabSeparatedService(text);
  if (tabResults.length > 0) return tabResults;

  const results: ParsedSeaService[] = [];

  // Pattern: date range (DD/MM/YYYY - DD/MM/YYYY) + vessel name + IMO + rank + category
  const datePattern = /(\d{2}\/\d{2}\/\d{4})\s*[-–]\s*(\d{2}\/\d{2}\/\d{4})/g;
  const dates = [...text.matchAll(datePattern)];

  // Vessel names with IMO: "VESSEL NAME - 123456" or "VESSEL NAME (123456)"
  const vesselPattern = /([A-ZÀ-Ü][A-ZÀ-Ü0-9\s.'-]{2,}?)\s*[-–(]\s*(\d{4,7})/g;
  const vessels = [...text.matchAll(vesselPattern)];

  // Ranks (expanded list covering ENM portal values)
  const rankPattern = /(?:CAPITAINE|LIEUTENANT|SECOND CAPITAINE|SECOND|CHEF MECANICIEN|CHEF MÉCANICIEN|OFFICIER[A-ZÉÈ\s]*|MATELOT|BOSCO|MAITRE|MAÎTRE|PATRON|MÉCANICIEN|MECANICIEN|TIMONIER|GRAISSEUR|CUISINIER|COMMISSAIRE|RADIO|GABIER|CHAUFFEUR|PILOTE|MOUSSE|NOVICE)/gi;
  const ranks = [...text.matchAll(rankPattern)];

  // Categories: "Cat.: X" or "Catégorie X" or just isolated numbers after rank context
  const catPattern = /Cat(?:égorie|\.)\s*:?\s*(\d+)/gi;
  const cats = [...text.matchAll(catPattern)];

  const count = Math.min(dates.length, Math.max(vessels.length, 1));
  for (let i = 0; i < count; i++) {
    results.push({
      id: `enm-${Date.now()}-${i}`,
      startDate: parseFrenchDate(dates[i][1]),
      endDate: parseFrenchDate(dates[i][2]),
      vesselName: vessels[i]?.[1]?.trim() ?? "Navire inconnu",
      vesselImo: vessels[i]?.[2]?.trim() ?? "",
      rank: ranks[i]?.[0]?.trim().toUpperCase() ?? "",
      category: cats[i]?.[1] ?? "",
    });
  }

  return results;
}

/** Parse certificates from pasted text */
export function parseCertificatesText(text: string): ParsedCertificate[] {
  const results: ParsedCertificate[] = [];

  // Split by "n°" which precedes each certificate reference number
  const blocks = text.split(/n°\s*/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const refMatch = block.match(/^(\d+)/);
    if (!refMatch) continue;

    const reference = refMatch[1];

    // Get title from the text before "n°" in the previous block
    const prevBlock = blocks[i - 1];
    const lines = prevBlock.split("\n").filter((l) => l.trim());
    const title = lines[lines.length - 1]?.trim() ?? `Titre n°${reference}`;

    const isExpired = /expir|Expiré/i.test(block);
    const isValid = /Valide/i.test(block) && !isExpired;

    // Extract expiry date
    const expiryMatch = block.match(/(\d{2}\/\d{2}\/\d{4})/);

    results.push({
      certId: `enm-cert-${reference}`,
      title: title.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      enmReference: reference,
      status: isValid ? "valid" : "expired",
      expiryDate: expiryMatch ? parseFrenchDate(expiryMatch[1]) : undefined,
    });
  }

  // Fallback: try to find certificates by common patterns
  if (results.length === 0) {
    const certLines = text.split("\n").filter((l) => {
      const t = l.trim().toLowerCase();
      return (
        t.includes("brevet") || t.includes("certificat") ||
        t.includes("stcw") || t.includes("aptitude") ||
        t.includes("operateur") || t.includes("opérateur")
      );
    });

    for (let i = 0; i < certLines.length; i++) {
      const line = certLines[i].trim();
      const refMatch = line.match(/(\d{7,})/);
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
      const isExpired = /expir/i.test(line);

      results.push({
        certId: `enm-cert-fallback-${i}`,
        title: line.replace(/\d{7,}/, "").replace(/(\d{2}\/\d{2}\/\d{4})/, "").replace(/[|·•-]\s*(Valide|Expiré).*/i, "").trim(),
        enmReference: refMatch?.[1] ?? "",
        status: isExpired ? "expired" : "valid",
        expiryDate: dateMatch ? parseFrenchDate(dateMatch[1]) : undefined,
      });
    }
  }

  return results;
}

/** Parse medical aptitude from pasted text */
export function parseMedicalText(text: string): ParsedMedical {
  const result: ParsedMedical = { restrictions: [] };

  // Visit type: "Annuelle", "Initiale", "Renouvellement"
  const typeMatch = text.match(/Type de visite\s*[-:]\s*([^\n]+)/i)
    ?? text.match(/(Annuelle|Initiale|Renouvellement|Spéciale)/i);
  if (typeMatch) result.visitType = typeMatch[1].trim();

  // Dates (DD/MM/YYYY)
  const allDates = [...text.matchAll(/(\d{2}\/\d{2}\/\d{4})/g)].map((m) => m[1]);

  // Last visit: "Date de dernière visite" or "Dernière visite"
  const lastVisitMatch = text.match(/(?:dernière visite|date de visite)[^]*?(\d{2}\/\d{2}\/\d{4})/i);
  if (lastVisitMatch) {
    result.lastVisitDate = parseFrenchDate(lastVisitMatch[1]);
  } else if (allDates.length >= 1) {
    result.lastVisitDate = parseFrenchDate(allDates[0]);
  }

  // Validity: "Date de fin de validité" or "Validité"
  const validityMatch = text.match(/(?:fin de validité|validité)[^]*?(\d{2}\/\d{2}\/\d{4})/i);
  if (validityMatch) {
    result.expiryDate = parseFrenchDate(validityMatch[1]);
  } else if (allDates.length >= 2) {
    result.expiryDate = parseFrenchDate(allDates[1]);
  }

  // Decision: "Apte TF/TN", "Inapte", etc.
  const decisionMatch = text.match(/(?:Décision médicale|Décision)[^]*?(Apte[^\n]*|Inapte[^\n]*)/i)
    ?? text.match(/(Apte\s+[A-Z/\s]+(?:avec restriction)?)/i);
  if (decisionMatch) result.decision = decisionMatch[1].trim();

  // Duration
  const durationMatch = text.match(/(?:Durée de l'aptitude|Durée)[^]*?(\d+\s*mois)/i);
  if (durationMatch) result.duration = durationMatch[1].trim();

  // Restrictions
  const restrictionSection = text.match(/(?:Restriction|restriction)[s]?\s*[:]\s*([^\n]+(?:\n[^\n]+)*)/i);
  if (restrictionSection) {
    const lines = restrictionSection[1].split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length > 3 && !line.includes("Accueil") && !line.includes("Mon compte")) {
        result.restrictions.push(line);
      }
    }
  }
  // Also look for "Port de verres correcteurs" type patterns
  const knownRestrictions = text.match(/(Port de verres correcteurs|Lunettes obligatoires|Restriction[^.\n]+)/gi);
  if (knownRestrictions && result.restrictions.length === 0) {
    result.restrictions = [...new Set(knownRestrictions.map((r) => r.trim()))];
  }

  return result;
}

/** Extract marin ID from any pasted text */
export function extractMarinId(text: string): string | undefined {
  const match = text.match(/(?:n°\s*marin|marin\s*n°|N°\s*)\s*(\d{7,8})/i)
    ?? text.match(/(\d{8})/);
  return match?.[1];
}

/** Parse all ENM data from a single pasted text block */
export function parseEnmText(text: string): ParsedEnmData {
  return {
    seaService: parseSeaServiceText(text),
    certificates: parseCertificatesText(text),
    medical: parseMedicalText(text),
    enmMarinId: extractMarinId(text),
  };
}
