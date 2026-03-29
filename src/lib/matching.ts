import type { Job } from "@/data/jobs";
import type { User } from "@/lib/auth/AuthContext";
import { maritimeCertifications, getCertificationById } from "@/data/maritime-certifications";

/**
 * Matching score between a candidate and a job offer.
 * Returns a score between 0 and 100, plus details.
 *
 * Weights: brevet 40%, zone 25%, catégorie 20%, contrat 15%.
 * Uses structured STCW certifications with supersedes logic.
 */

export interface MatchResult {
  score: number; // 0-100
  details: string[];
  level: "excellent" | "good" | "partial" | "low";
}

// ── Brevet keyword fuzzy matching (fallback for freetext) ──

const BREVET_KEYWORDS: Record<string, string[]> = {
  capitaine: ["capitaine", "captain", "commandant"],
  mecanicien: ["mécanicien", "mecanicien", "mécanique", "machine"],
  chef: ["chef"],
  cfbs: ["cfbs", "sécurité", "securite", "safety"],
  "750": ["750"],
  "3000": ["3000"],
  "8000": ["8000"],
  "200": ["200"],
  "500": ["500"],
  illimite: ["illimité", "illimite", "unlimited"],
};

function normalizeBrevet(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function fuzzyBrevetMatch(candidateCerts: string[], jobBrevet: string): { score: number; matched: string[] } {
  const jobNorm = normalizeBrevet(jobBrevet);
  const matched: string[] = [];
  let bestScore = 0;

  for (const cert of candidateCerts) {
    const certNorm = normalizeBrevet(cert);
    if (jobNorm.includes(certNorm) || certNorm.includes(jobNorm)) {
      matched.push(cert);
      bestScore = 100;
      continue;
    }
    let keywordMatches = 0;
    let totalKeywords = 0;
    for (const [, keywords] of Object.entries(BREVET_KEYWORDS)) {
      const inJob = keywords.some((k) => jobNorm.includes(k));
      const inCert = keywords.some((k) => certNorm.includes(k));
      if (inJob) { totalKeywords++; if (inCert) keywordMatches++; }
    }
    if (totalKeywords > 0) {
      const kwScore = Math.round((keywordMatches / totalKeywords) * 100);
      if (kwScore >= 50) { matched.push(cert); bestScore = Math.max(bestScore, kwScore); }
    }
  }
  return { score: bestScore, matched };
}

// ── Structured STCW matching with supersedes ──

/** Try to find the best matching certification ID from a job's brevet text. */
function resolveJobBrevetToId(brevetText: string): string | null {
  const norm = normalizeBrevet(brevetText);
  // Try exact label match first
  for (const cert of maritimeCertifications) {
    if (normalizeBrevet(cert.label) === norm || normalizeBrevet(cert.shortLabel) === norm) {
      return cert.id;
    }
  }
  // Try substring match
  for (const cert of maritimeCertifications) {
    const labelNorm = normalizeBrevet(cert.label);
    if (norm.includes(labelNorm) || labelNorm.includes(norm)) {
      return cert.id;
    }
  }
  // Try STCW code match
  for (const cert of maritimeCertifications) {
    if (cert.stcwCode && norm.includes(normalizeBrevet(cert.stcwCode))) {
      return cert.id;
    }
  }
  return null;
}

function structuredBrevetMatch(
  candidateCertIds: string[],
  jobBrevet: string
): { score: number; matched: string[] } {
  const requiredId = resolveJobBrevetToId(jobBrevet);
  if (!requiredId) return { score: 0, matched: [] };

  for (const certId of candidateCertIds) {
    // Direct match
    if (certId === requiredId) {
      const cert = getCertificationById(certId);
      return { score: 100, matched: [cert?.shortLabel ?? certId] };
    }
    // Supersedes match (higher cert satisfies lower requirement)
    const cert = getCertificationById(certId);
    if (cert?.supersedes.includes(requiredId)) {
      return { score: 100, matched: [`${cert.shortLabel} (couvre ${getCertificationById(requiredId)?.shortLabel})`] };
    }
  }

  // Partial match: same category but different level
  const requiredCert = getCertificationById(requiredId);
  if (requiredCert) {
    for (const certId of candidateCertIds) {
      const cert = getCertificationById(certId);
      if (cert && cert.category === requiredCert.category) {
        // Same category = 50% match
        return { score: 50, matched: [`${cert.shortLabel} (même catégorie)`] };
      }
    }
  }

  return { score: 0, matched: [] };
}

// ── Main scoring function ──

export function computeMatchScore(candidate: User, job: Job): MatchResult {
  const details: string[] = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  // 1. Brevet/Certification match (40% weight)
  const certWeight = 40;
  totalWeight += certWeight;

  if (job.brevet) {
    let brevetScore = 0;
    let matchedLabels: string[] = [];

    // Prefer structured certifications
    const structuredCerts = candidate.structuredCertifications;
    if (structuredCerts && structuredCerts.length > 0) {
      const certIds = structuredCerts.map((c) => c.certId);
      const result = structuredBrevetMatch(certIds, job.brevet);
      brevetScore = result.score;
      matchedLabels = result.matched;
    } else {
      // Fallback to freetext certifications
      const candidateAny = candidate as unknown as Record<string, unknown>;
      const freeCerts: string[] = [];
      if (candidateAny.certifications) {
        const val = candidateAny.certifications;
        if (typeof val === "string") freeCerts.push(...val.split(",").map((s) => s.trim()).filter(Boolean));
        else if (Array.isArray(val)) freeCerts.push(...(val as string[]));
      }
      if (freeCerts.length > 0) {
        const result = fuzzyBrevetMatch(freeCerts, job.brevet);
        brevetScore = result.score;
        matchedLabels = result.matched;
      }
    }

    const earned = Math.round((brevetScore / 100) * certWeight);
    earnedWeight += earned;
    if (matchedLabels.length > 0) {
      details.push(`Brevet compatible : ${matchedLabels.join(", ")}`);
    } else {
      details.push(`Brevet requis : ${job.brevet}`);
    }
  } else {
    earnedWeight += certWeight;
    details.push("Aucun brevet requis");
  }

  // 2. Zone/location match (25% weight)
  const zoneWeight = 25;
  totalWeight += zoneWeight;
  const candidateZone = candidate.preferredZone ?? "";

  if (candidateZone) {
    if (candidateZone === job.zone) {
      earnedWeight += zoneWeight;
      details.push("Zone géographique correspondante");
    } else {
      details.push("Zone différente de la préférence");
    }
  }

  // 3. Category/position match (20% weight)
  const catWeight = 20;
  totalWeight += catWeight;
  const desiredPos = (candidate.desiredPosition ?? "").toLowerCase();
  const jobCat = job.category.toLowerCase();
  const jobTitle = job.title.toLowerCase();

  if (desiredPos && (jobCat.includes(desiredPos) || jobTitle.includes(desiredPos) || desiredPos.includes(jobCat))) {
    earnedWeight += catWeight;
    details.push("Catégorie de poste correspondante");
  } else if (desiredPos) {
    details.push("Catégorie de poste différente");
  }

  // 4. Contract type preference (15% weight)
  const contractWeight = 15;
  totalWeight += contractWeight;
  earnedWeight += contractWeight; // full points by default

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  let level: MatchResult["level"];
  if (score >= 75) level = "excellent";
  else if (score >= 50) level = "good";
  else if (score >= 25) level = "partial";
  else level = "low";

  if (details.length === 0) {
    details.push("Complétez votre profil pour améliorer le matching");
  }

  return { score, details, level };
}

export const MATCH_COLORS: Record<MatchResult["level"], { bg: string; text: string; label: string }> = {
  excellent: { bg: "bg-[var(--gaspe-green-50)]", text: "text-[var(--gaspe-green-600)]", label: "Excellent match" },
  good: { bg: "bg-[var(--gaspe-teal-50)]", text: "text-[var(--gaspe-teal-600)]", label: "Bon match" },
  partial: { bg: "bg-[var(--gaspe-warm-50)]", text: "text-[var(--gaspe-warm-600)]", label: "Match partiel" },
  low: { bg: "bg-[var(--gaspe-neutral-50)]", text: "text-foreground-muted", label: "Match faible" },
};
