/**
 * API-backed AuthStore — replaces LocalStorageAuthStore
 *
 * Calls the GASPE API Worker for all auth operations.
 * JWT token is stored in httpOnly cookie (set by server),
 * so credentials: "include" is required on all fetches.
 *
 * The AuthStore interface was designed for synchronous localStorage access,
 * so this implementation caches data locally and syncs with the API.
 * The AuthContext should use the async methods directly when available.
 */

import type { User } from "./types";
import type { AuthStore } from "./auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return res.json() as Promise<T>;
}

/**
 * API-backed AuthStore for production use with CF Worker backend.
 *
 * Since the AuthStore interface is synchronous (designed for localStorage),
 * this store caches state locally. The AuthContext should prefer the
 * async static methods (ApiAuthStore.login, etc.) for real operations.
 */
export class ApiAuthStore implements AuthStore {
  private cachedUser: User | null = null;
  private cachedUsers: User[] = [];

  // ── Synchronous interface (cache-based) ──

  getUsers(): User[] {
    return this.cachedUsers;
  }

  setUsers(_users: User[]): void {
    this.cachedUsers = _users;
  }

  getPasswords(): Record<string, string> {
    // Passwords are server-side only
    return {};
  }

  setPasswords(_passwords: Record<string, string>): void {
    // No-op: passwords managed server-side
  }

  getCurrentUser(): User | null {
    return this.cachedUser;
  }

  setCurrentUser(user: User | null): void {
    this.cachedUser = user;
  }

  clearSession(): void {
    this.cachedUser = null;
    // Fire and forget — clear the httpOnly cookie
    apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }

  // ── Async API methods (used by AuthContext) ──

  static async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const res = await apiFetch<{ success?: boolean; error?: string; user?: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.error) return { success: false, error: res.error };
      return { success: true, user: res.user ?? undefined };
    } catch {
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  }

  static async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: "adherent" | "candidat";
    company?: string;
    currentPosition?: string;
    desiredPosition?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const res = await apiFetch<{ success?: boolean; error?: string; user?: User; message?: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.error) return { success: false, error: res.error };
      return { success: true, user: res.user ?? undefined };
    } catch {
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  }

  static async fetchCurrentUser(): Promise<User | null> {
    try {
      const res = await apiFetch<{ user: User | null }>("/api/auth/me");
      return res.user ?? null;
    } catch {
      return null;
    }
  }

  static async fetchAllUsers(): Promise<User[]> {
    try {
      const res = await apiFetch<{ users?: User[]; error?: string }>("/api/auth/users");
      return res.users ?? [];
    } catch {
      return [];
    }
  }

  static async approveUser(userId: string): Promise<boolean> {
    try {
      const res = await apiFetch<{ success?: boolean }>(`/api/auth/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ approved: true }),
      });
      return !!res.success;
    } catch {
      return false;
    }
  }

  static async rejectUser(userId: string): Promise<boolean> {
    try {
      const res = await apiFetch<{ success?: boolean }>(`/api/auth/users/${userId}`, {
        method: "DELETE",
      });
      return !!res.success;
    } catch {
      return false;
    }
  }

  static async updateUserProfile(userId: string, data: Partial<User>): Promise<User | null> {
    try {
      const res = await apiFetch<{ success?: boolean; user?: User }>(`/api/auth/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.user ?? null;
    } catch {
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookie will expire anyway
    }
  }
}
