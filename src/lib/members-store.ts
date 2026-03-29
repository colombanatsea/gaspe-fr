/**
 * Centralized members store — reads from localStorage CMS with fallback to static data.
 * Used by MemberMap, MembersMarquee, nos-adherents, StatsSection, admin/membres.
 */

import { members as staticMembers } from "@/data/members";
import type { Member } from "@/types";

export const MEMBERS_KEY = "gaspe_members";

export interface StoredMember extends Member {
  archived?: boolean;
}

/** Get all members from CMS (localStorage), seeding from static data on first call. */
export function getStoredMembers(): StoredMember[] {
  if (typeof window === "undefined") return staticMembers;
  const raw = localStorage.getItem(MEMBERS_KEY);
  if (!raw) {
    const seeded: StoredMember[] = staticMembers.map((m) => ({ ...m, archived: false }));
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw);
}

/** Get only active (non-archived) members. */
export function getActiveMembers(): StoredMember[] {
  return getStoredMembers().filter((m) => !m.archived);
}

/** Save members to localStorage. */
export function saveMembers(members: StoredMember[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}
