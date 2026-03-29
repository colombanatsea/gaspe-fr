import type { Job } from "@/data/jobs";
import type { User } from "@/lib/auth/AuthContext";

/**
 * Matching score between a candidate and a job offer.
 * Returns a score between 0 and 100, plus details.
 */

export interface MatchResult {
  score: number; // 0-100
  details: string[];
  level: "excellent" | "good" | "partial" | "low";
}

// Brevet keywords mapping for fuzzy matching
const BREVET_KEYWORDS: Record<string, string[]> = {
  "capitaine": ["capitaine", "captain", "commandant"],
  "mecanicien": ["mécanicien", "mecanicien", "mécanique", "machine"],
  "chef": ["chef"],
  "cfbs": ["cfbs", "sécurité", "securite", "safety"],
  "750": ["750"],
  "3000": ["3000"],
  "8000": ["8000"],
  "200": ["200"],
  "500": ["500"],
  "illimite": ["illimité", "illimite", "unlimited"],
};

function normalizeBrevet(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function brevetMatchScore(candidateCerts: string[], jobBrevet?: string): { score: number; matched: string[] } {
  if (!jobBrevet || candidateCerts.length === 0) return { score: 0, matched: [] };

  const jobNorm = normalizeBrevet(jobBrevet);
  const matched: string[] = [];
  let bestScore = 0;

  for (const cert of candidateCerts) {
    const certNorm = normalizeBrevet(cert);

    // Exact or substring match
    if (jobNorm.includes(certNorm) || certNorm.includes(jobNorm)) {
      matched.push(cert);
      bestScore = Math.max(bestScore, 100);
      continue;
    }

    // Keyword overlap scoring
    let keywordMatches = 0;
    let totalKeywords = 0;
    for (const [, keywords] of Object.entries(BREVET_KEYWORDS)) {
      const inJob = keywords.some((k) => jobNorm.includes(k));
      const inCert = keywords.some((k) => certNorm.includes(k));
      if (inJob) {
        totalKeywords++;
        if (inCert) {
          keywordMatches++;
        }
      }
    }

    if (totalKeywords > 0) {
      const kwScore = Math.round((keywordMatches / totalKeywords) * 100);
      if (kwScore >= 50) {
        matched.push(cert);
        bestScore = Math.max(bestScore, kwScore);
      }
    }
  }

  return { score: bestScore, matched };
}

// Zone mapping from region names to job zones
const REGION_TO_ZONE: Record<string, string[]> = {
  normandie: ["normandie"],
  bretagne: ["bretagne"],
  "nouvelle-aquitaine": ["nouvelle-aquitaine"],
  "pays-de-la-loire": ["pays-de-la-loire"],
  occitanie: ["occitanie"],
  paca: ["paca", "provence"],
  "ile-de-france": ["ile-de-france", "paris"],
  "dom-tom": ["dom-tom", "guadeloupe", "martinique", "mayotte", "guyane", "reunion"],
};

export function computeMatchScore(candidate: User, job: Job): MatchResult {
  const details: string[] = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  // 1. Brevet/Certification match (40% weight)
  const certWeight = 40;
  totalWeight += certWeight;
  const candidateCerts: string[] = [];

  // Extract certifications from user profile (stored as certifications array)
  const candidateAny = candidate as unknown as Record<string, unknown>;
  if (candidateAny.certifications) {
    candidateCerts.push(...(candidateAny.certifications as string[]));
  }

  if (job.brevet && candidateCerts.length > 0) {
    const { score: brevetScore, matched } = brevetMatchScore(candidateCerts, job.brevet);
    const earned = Math.round((brevetScore / 100) * certWeight);
    earnedWeight += earned;
    if (matched.length > 0) {
      details.push(`Brevet compatible : ${matched.join(", ")}`);
    }
  } else if (!job.brevet) {
    // No brevet required = full points
    earnedWeight += certWeight;
    details.push("Aucun brevet requis");
  }

  // 2. Zone/location match (25% weight)
  const zoneWeight = 25;
  totalWeight += zoneWeight;
  const candidateZone = (candidateAny.preferredZone as string) ?? "";

  if (candidateZone) {
    const jobZone = job.zone;
    if (candidateZone === jobZone) {
      earnedWeight += zoneWeight;
      details.push("Zone géographique correspondante");
    } else {
      // Partial match for nearby zones
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
  // Give full points by default (no contract preference stored yet)
  earnedWeight += contractWeight;

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
