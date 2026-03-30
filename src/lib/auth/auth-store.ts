/* ------------------------------------------------------------------ */
/*  Auth store interface — abstraction for storage backend             */
/*  Current: localStorage. Future: NextAuth + D1/API.                  */
/*  To migrate, implement AuthStore with a new backend and swap in     */
/*  the getAuthStore() factory.                                        */
/* ------------------------------------------------------------------ */

import type { User } from "./types";

export interface AuthStore {
  /** Read all users */
  getUsers(): User[];
  /** Write all users */
  setUsers(users: User[]): void;

  /** Read passwords map (userId → hash) */
  getPasswords(): Record<string, string>;
  /** Write passwords map */
  setPasswords(passwords: Record<string, string>): void;

  /** Read current logged-in user */
  getCurrentUser(): User | null;
  /** Set current logged-in user */
  setCurrentUser(user: User | null): void;

  /** Clear current user session */
  clearSession(): void;
}

/* ── localStorage implementation ── */

import { safeParse, usersArraySchema, passwordsSchema, userSchema } from "@/lib/schemas";

const USERS_KEY = "gaspe_users";
const PASSWORDS_KEY = "gaspe_passwords";
const CURRENT_KEY = "gaspe_current_user";

class LocalStorageAuthStore implements AuthStore {
  getUsers(): User[] {
    if (typeof window === "undefined") return [];
    return safeParse(usersArraySchema, localStorage.getItem(USERS_KEY), []);
  }

  setUsers(users: User[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  getPasswords(): Record<string, string> {
    if (typeof window === "undefined") return {};
    return safeParse(passwordsSchema, localStorage.getItem(PASSWORDS_KEY), {});
  }

  setPasswords(passwords: Record<string, string>): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    return safeParse(userSchema.nullable(), localStorage.getItem(CURRENT_KEY), null);
  }

  setCurrentUser(user: User | null): void {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_KEY);
    }
  }

  clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CURRENT_KEY);
  }
}

/* ── Factory — swap this to change backend ── */

let _store: AuthStore | null = null;

export function getAuthStore(): AuthStore {
  if (!_store) _store = new LocalStorageAuthStore();
  return _store;
}

/** For testing: inject a mock store */
export function setAuthStore(store: AuthStore): void {
  _store = store;
}

/* Re-export storage keys for cross-tab sync listener */
export { USERS_KEY, PASSWORDS_KEY, CURRENT_KEY };
