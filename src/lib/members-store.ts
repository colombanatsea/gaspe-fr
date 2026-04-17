/* ------------------------------------------------------------------ */
/*  Members Store — dual-mode member management                       */
/*  localStorage (demo) ↔ API/D1 (production)                        */
/*  In API mode, members are fetched from /api/organizations          */
/* ------------------------------------------------------------------ */

import { members as staticMembers } from "@/data/members";
import type { Member } from "@/types";
import { safeParse, membersArraySchema } from "./schemas";
import { apiFetch, isApiMode } from "./api-client";

export const MEMBERS_KEY = "gaspe_members";

export interface StoredMember extends Member {
  archived?: boolean;
}

/** Map API organization response to StoredMember */
function orgToMember(org: Record<string, unknown>): StoredMember {
  return {
    name: (org.name as string) ?? "",
    slug: (org.slug as string) ?? "",
    city: (org.city as string) ?? "",
    latitude: (org.latitude as number) ?? 0,
    longitude: (org.longitude as number) ?? 0,
    region: (org.region as string) ?? "",
    territory: (org.territory as "metropole" | "dom-tom") ?? "metropole",
    category: (org.category as "titulaire" | "associe") ?? "titulaire",
    description: (org.description as string) ?? undefined,
    logoUrl: (org.logoUrl as string) ?? undefined,
    websiteUrl: (org.websiteUrl as string) ?? undefined,
    employeeCount: (org.employeeCount as number) ?? undefined,
    shipCount: (org.shipCount as number) ?? undefined,
    archived: org.archived === true,
  };
}

/* ── localStorage helpers ── */

function getLocalMembers(): StoredMember[] {
  if (typeof window === "undefined") return staticMembers as StoredMember[];
  const raw = localStorage.getItem(MEMBERS_KEY);
  if (!raw) {
    const seeded: StoredMember[] = staticMembers.map((m) => ({ ...m, archived: false }));
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  const parsed = safeParse(membersArraySchema, raw, staticMembers as StoredMember[]);
  // Force re-seed if cached data has stale logos (v2.12: replaced placeholders with real logos)
  if (parsed.some((m) => m.logoUrl?.includes("gaspe.fr/wp-content") || m.logoUrl?.includes("placeholder-"))) {
    const seeded: StoredMember[] = staticMembers.map((m) => ({ ...m, archived: false }));
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return parsed;
}

function setLocalMembers(members: StoredMember[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}

/* ── Public API ── */

/** Get all members from API (production) or localStorage (demo). */
export async function getStoredMembers(): Promise<StoredMember[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ organizations?: Record<string, unknown>[] }>("/api/organizations");
      const orgs = res.organizations ?? [];
      return orgs.map(orgToMember);
    } catch { /* fall through to localStorage */ }
  }
  return getLocalMembers();
}

/** Get only active (non-archived) members. */
export async function getActiveMembers(): Promise<StoredMember[]> {
  const all = await getStoredMembers();
  return all.filter((m) => !m.archived);
}

/** Save members to localStorage (demo mode only). */
export function saveMembers(members: StoredMember[]) {
  setLocalMembers(members);
}

/** Update a single member (API mode: PATCH organization). */
export async function updateMember(slug: string, updates: Partial<StoredMember>): Promise<boolean> {
  if (isApiMode()) {
    try {
      const listRes = await apiFetch<{ organizations?: Record<string, unknown>[] }>("/api/organizations");
      const org = (listRes.organizations ?? []).find((o) => o.slug === slug);
      if (!org) return false;
      const res = await apiFetch<{ success?: boolean }>(`/api/organizations/${org.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return !!res.success;
    } catch { return false; }
  }

  // localStorage mode
  const members = getLocalMembers();
  const idx = members.findIndex((m) => m.slug === slug);
  if (idx < 0) return false;
  members[idx] = { ...members[idx], ...updates };
  setLocalMembers(members);
  return true;
}

/** Archive/unarchive a member. */
export async function toggleMemberArchived(slug: string): Promise<boolean> {
  if (isApiMode()) {
    try {
      const listRes = await apiFetch<{ organizations?: Record<string, unknown>[] }>("/api/organizations?include_archived=1");
      const org = (listRes.organizations ?? []).find((o) => o.slug === slug);
      if (!org) return false;
      const currentArchived = org.archived === true;
      const res = await apiFetch<{ success?: boolean }>(`/api/organizations/${org.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: currentArchived ? 0 : 1 }),
      });
      return !!res.success;
    } catch { return false; }
  }

  const members = getLocalMembers();
  const idx = members.findIndex((m) => m.slug === slug);
  if (idx < 0) return false;
  members[idx].archived = !members[idx].archived;
  setLocalMembers(members);
  return true;
}
