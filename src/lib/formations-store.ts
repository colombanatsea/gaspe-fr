/* ------------------------------------------------------------------ */
/*  Formations Store – dual-mode (localStorage demo / API D1 prod)     */
/*  Session 54 — P0-1 du rapport docs/PRODUCTION-SAFETY-2026.md.       */
/*  Avant : localStorage `gaspe_formations` isolé par navigateur.      */
/*  Après : table D1 `formations` (migration 0031) partagée.           */
/*                                                                     */
/*  Le type source de vérité est `Formation` exporté par               */
/*  src/app/(admin)/admin/formations/page.tsx (utilisé par toutes les  */
/*  UIs en lecture). Ce store ré-exporte ce type avec ses extensions   */
/*  P0-3 (registrationDeadline) et soft-delete (isArchived).           */
/* ------------------------------------------------------------------ */

import type { Formation } from "@/app/(admin)/admin/formations/page";
import { apiFetch, isApiMode } from "./api-client";

const STORAGE_KEY = "gaspe_formations";

/** Type étendu — extension des champs venus de D1 (P0-3). */
export interface StoredFormation extends Formation {
  /** Slug (généré côté serveur si non fourni). Distinct de `id`. */
  slug?: string;
  /** Description HTML enrichie (optionnelle, distincte de `description`). */
  content?: string;
  /** Catégorie éditoriale ('sécurité' / 'brevets' / 'management' / etc.). */
  category?: string;
  /** ISO YYYY-MM-DD. Si dépassée, l'UI affiche « Inscriptions closes ». */
  registrationDeadline?: string;
  /** Soft-delete (P0-1) : la fiche reste consultable mais pas inscriptible. */
  isArchived?: boolean;
  /** Visibilité publique. Défaut true. */
  isPublished?: boolean;
}

/**
 * Vérifie si la deadline d'inscription est passée. Toujours false si non
 * renseignée (rétro-compatibilité avec les formations sans deadline).
 */
export function isRegistrationClosed(f: StoredFormation, now = new Date()): boolean {
  if (f.isArchived) return true;
  if (!f.registrationDeadline) return false;
  const deadline = new Date(f.registrationDeadline);
  if (isNaN(deadline.getTime())) return false;
  return now > deadline;
}

/* ── localStorage helpers (mode démo) ── */

export function readLocalFormations(): StoredFormation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeLocalFormations(list: StoredFormation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / refus storage : silencieux */
  }
}

/* ── Public API (async pour cohérence prod) ── */

/**
 * Liste toutes les formations visibles publiquement (publiées + non archivées).
 *
 * En mode API : appelle GET /api/formations (le Worker filtre déjà côté serveur).
 * En mode demo : lit le localStorage.
 */
export async function listFormations(): Promise<StoredFormation[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ formations?: StoredFormation[] }>("/api/formations");
      return res.formations ?? [];
    } catch {
      return [];
    }
  }
  return readLocalFormations();
}

/**
 * Liste toutes les formations y compris archives. Côté UI utilisé par admin/staff
 * uniquement ; le Worker enforce manage_formations via JWT.
 */
export async function listAllFormations(): Promise<StoredFormation[]> {
  return listFormations();
}

/** Récupère une formation par slug ou id. */
export async function getFormation(slugOrId: string): Promise<StoredFormation | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ formation?: StoredFormation }>(
        `/api/formations/${encodeURIComponent(slugOrId)}`,
      );
      return res.formation ?? null;
    } catch {
      return null;
    }
  }
  const all = readLocalFormations();
  return all.find((f) => f.id === slugOrId || f.slug === slugOrId) ?? null;
}

/** Crée une formation (admin/staff manage_formations côté Worker). */
export async function createFormation(
  payload: Partial<StoredFormation>,
): Promise<StoredFormation | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ formation?: StoredFormation }>("/api/formations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.formation ?? null;
    } catch {
      return null;
    }
  }
  // Mode demo : ajout en localStorage.
  const list = readLocalFormations();
  const id = payload.id ?? `form-${Date.now().toString(36)}`;
  const created: StoredFormation = {
    ...(payload as StoredFormation),
    id,
    title: payload.title ?? "Nouvelle formation",
    description: payload.description ?? "",
    organizer: payload.organizer ?? "",
    startDate: payload.startDate ?? "",
    endDate: payload.endDate ?? "",
    location: payload.location ?? "",
    duration: payload.duration ?? "",
    capacity: payload.capacity ?? 0,
    targetAudience: payload.targetAudience ?? "",
    prerequisites: payload.prerequisites ?? "",
    price: payload.price ?? "",
    contactEmail: payload.contactEmail ?? "",
    status: payload.status ?? "open",
    isPublished: payload.isPublished ?? true,
    isArchived: payload.isArchived ?? false,
  };
  list.push(created);
  writeLocalFormations(list);
  return created;
}

/** Met à jour une formation. */
export async function updateFormation(
  id: string,
  patch: Partial<StoredFormation>,
): Promise<StoredFormation | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ formation?: StoredFormation }>(
        `/api/formations/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(patch) },
      );
      return res.formation ?? null;
    } catch {
      return null;
    }
  }
  const list = readLocalFormations();
  const idx = list.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  writeLocalFormations(list);
  return list[idx];
}

/** Soft-delete (is_archived=1). */
export async function deleteFormation(id: string): Promise<boolean> {
  if (isApiMode()) {
    try {
      await apiFetch<{ success?: boolean }>(
        `/api/formations/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      return true;
    } catch {
      return false;
    }
  }
  const list = readLocalFormations().filter((f) => f.id !== id);
  writeLocalFormations(list);
  return true;
}

/* ── Helpers UI : gestion d'inscription côté adhérent / candidat ── */

/**
 * Inscrit un user à une formation. Persiste via API en prod (PATCH avec le
 * tableau `registrations` mis à jour côté Worker), via localStorage en demo.
 *
 * Retourne `null` si la deadline d'inscription est passée (P0-3).
 */
export async function registerUserToFormation(
  formationId: string,
  userId: string,
): Promise<StoredFormation | null> {
  const f = await getFormation(formationId);
  if (!f) return null;
  if (isRegistrationClosed(f)) return null;
  const registrations = Array.from(new Set([...(f.registrations ?? []), userId]));
  return updateFormation(formationId, { registrations });
}

/** Désinscrit un user. */
export async function unregisterUserFromFormation(
  formationId: string,
  userId: string,
): Promise<StoredFormation | null> {
  const f = await getFormation(formationId);
  if (!f) return null;
  const registrations = (f.registrations ?? []).filter((id) => id !== userId);
  return updateFormation(formationId, { registrations });
}
