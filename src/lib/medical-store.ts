/* ------------------------------------------------------------------ */
/*  Medical Visits Store — dual-mode                                   */
/*  localStorage (demo) ↔ API/D1 (production)                         */
/* ------------------------------------------------------------------ */

import type { MedicalVisit } from "@/data/ssgm";
import { apiFetch, isApiMode } from "./api-client";

const VISITS_KEY = "gaspe_medical_visits";

/* ── Status computation ── */

export function computeStatus(visit: MedicalVisit): MedicalVisit["status"] {
  if (!visit.expiryDate) return visit.status === "completed" ? "completed" : "scheduled";
  const expiry = new Date(visit.expiryDate);
  const now = new Date();
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "expired";
  if (daysUntil < 60) return "expiring_soon";
  return "completed";
}

/* ── localStorage helpers ── */

function getLocalVisits(): MedicalVisit[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(VISITS_KEY) ?? "[]") as MedicalVisit[];
  } catch { return []; }
}

function saveLocalVisits(visits: MedicalVisit[]) {
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
}

/* ── Public API ── */

/** Get all medical visits for current user */
export async function getMedicalVisits(): Promise<MedicalVisit[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ visits?: MedicalVisit[] }>("/api/medical-visits");
      const visits = res.visits ?? [];
      return visits.map((v) => ({ ...v, status: computeStatus(v) }));
    } catch { /* fall through */ }
  }

  return getLocalVisits().map((v) => ({ ...v, status: computeStatus(v) }));
}

/** Create a new medical visit */
export async function createMedicalVisit(visit: MedicalVisit): Promise<MedicalVisit | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ success?: boolean; visit?: MedicalVisit }>("/api/medical-visits", {
        method: "POST",
        body: JSON.stringify(visit),
      });
      const created = res.visit;
      return created ? { ...created, status: computeStatus(created) } : null;
    } catch { return null; }
  }

  // localStorage mode
  const all = getLocalVisits();
  all.unshift(visit);
  saveLocalVisits(all);
  return visit;
}

/** Update an existing medical visit */
export async function updateMedicalVisit(id: string, updates: Partial<MedicalVisit>): Promise<boolean> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ success?: boolean }>(`/api/medical-visits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return !!res.success;
    } catch { return false; }
  }

  const all = getLocalVisits();
  const idx = all.findIndex((v) => v.id === id);
  if (idx < 0) return false;
  all[idx] = { ...all[idx], ...updates };
  saveLocalVisits(all);
  return true;
}

/** Delete a medical visit */
export async function deleteMedicalVisit(id: string): Promise<boolean> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ success?: boolean }>(`/api/medical-visits/${id}`, {
        method: "DELETE",
      });
      return !!res.success;
    } catch { return false; }
  }

  const all = getLocalVisits().filter((v) => v.id !== id);
  saveLocalVisits(all);
  return true;
}
