/* ------------------------------------------------------------------ */
/*  Fleet Store – dual-mode vessel management per organization        */
/*  localStorage (demo) ↔ API/D1 (production)                         */
/*                                                                    */
/*  Data model : per-organization FleetVessel[], keyed by member slug. */
/*  The seed from `src/data/fleet-seed.ts` is merged on first read     */
/*  (non-destructive : once the store has been written for a slug, it  */
/*  becomes the source of truth).                                      */
/*                                                                    */
/*  Ownership scoping is enforced by the caller (admin = all slugs,   */
/*  adhérent = their own slug only). In API mode, the Worker verifies  */
/*  the JWT payload.organization_id against the target slug.           */
/* ------------------------------------------------------------------ */

import type { FleetVessel } from "@/types";
import { FLEET_SEED } from "@/data/fleet-seed";
import { apiFetch, isApiMode } from "./api-client";

export const FLEET_KEY = "gaspe_fleet";

/** Shape stored in localStorage : { slug → vessels[] } */
type FleetByslug = Record<string, FleetVessel[]>;

/* ── Local helpers ── */

function readLocal(): FleetByslug {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FLEET_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as FleetByslug;
  } catch {
    return {};
  }
}

function writeLocal(data: FleetByslug) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FLEET_KEY, JSON.stringify(data));
}

function makeId(): string {
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Ensure every vessel has a stable `id` (seed entries may have collision-free pre-assigned ones). */
function withIds(vessels: FleetVessel[]): FleetVessel[] {
  const seen = new Set<string>();
  return vessels.map((v) => {
    let id = v.id;
    if (!id || seen.has(id)) id = makeId();
    seen.add(id);
    return { ...v, id };
  });
}

/* ── Public API ── */

/**
 * Read the fleet for one compagnie (by slug).
 * Falls back to the seed when no user-authored data exists yet.
 */
export async function getFleet(slug: string): Promise<FleetVessel[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ vessels?: FleetVessel[] }>(`/api/organizations/${slug}/fleet`);
      if (res.vessels && res.vessels.length > 0) return withIds(res.vessels);
    } catch {
      /* fall through to local / seed */
    }
  }

  const local = readLocal();
  const stored = local[slug];
  if (stored && stored.length > 0) return withIds(stored);

  return withIds(FLEET_SEED[slug] ?? []);
}

/**
 * Save the full fleet for one compagnie (overwrites).
 * Scope validation (admin OR owner) is the caller's responsibility in demo
 * mode; in API mode the Worker re-checks against the JWT.
 */
export async function saveFleet(slug: string, vessels: FleetVessel[]): Promise<boolean> {
  const normalized = withIds(vessels);

  if (isApiMode()) {
    try {
      const res = await apiFetch<{ success?: boolean }>(`/api/organizations/${slug}/fleet`, {
        method: "PUT",
        body: JSON.stringify({ vessels: normalized }),
      });
      if (res.success) return true;
    } catch {
      /* fall through to local */
    }
  }

  const data = readLocal();
  data[slug] = normalized;
  writeLocal(data);
  return true;
}

/** Add a single vessel, return the updated list. */
export async function addVessel(slug: string, vessel: FleetVessel): Promise<FleetVessel[]> {
  const current = await getFleet(slug);
  const next = [...current, { ...vessel, id: vessel.id || makeId() }];
  await saveFleet(slug, next);
  return next;
}

/** Update one vessel by id, return the updated list. */
export async function updateVessel(slug: string, id: string, patch: Partial<FleetVessel>): Promise<FleetVessel[]> {
  const current = await getFleet(slug);
  const next = current.map((v) => (v.id === id ? { ...v, ...patch, id: v.id } : v));
  await saveFleet(slug, next);
  return next;
}

/** Delete one vessel by id, return the updated list. */
export async function deleteVessel(slug: string, id: string): Promise<FleetVessel[]> {
  const current = await getFleet(slug);
  const next = current.filter((v) => v.id !== id);
  await saveFleet(slug, next);
  return next;
}

/**
 * Read all fleets at once (admin view).
 * Merges store overrides on top of seed; a slug appears if either source
 * has at least one vessel.
 */
export async function getAllFleets(): Promise<FleetByslug> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ fleets?: FleetByslug }>("/api/organizations/fleet");
      if (res.fleets) {
        const merged: FleetByslug = { ...FLEET_SEED };
        for (const [slug, vessels] of Object.entries(res.fleets)) {
          if (vessels && vessels.length > 0) merged[slug] = withIds(vessels);
        }
        return merged;
      }
    } catch {
      /* fall through to local */
    }
  }

  const local = readLocal();
  const merged: FleetByslug = {};
  // Seed first
  for (const [slug, vessels] of Object.entries(FLEET_SEED)) {
    merged[slug] = withIds(vessels);
  }
  // Local overrides
  for (const [slug, vessels] of Object.entries(local)) {
    if (vessels && vessels.length > 0) merged[slug] = withIds(vessels);
  }
  return merged;
}

/** Reset one compagnie's fleet back to the seed (admin action). */
export async function resetFleetToSeed(slug: string): Promise<FleetVessel[]> {
  const seed = withIds(FLEET_SEED[slug] ?? []);
  await saveFleet(slug, seed);
  return seed;
}
