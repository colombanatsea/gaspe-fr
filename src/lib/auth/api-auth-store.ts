/**
 * API-backed AuthStore — replaces LocalStorageAuthStore
 *
 * Calls the GASPE API Worker for all auth operations.
 * JWT token is stored in localStorage and sent via Authorization header
 * (cross-origin cookies don't work between pages.dev and workers.dev).
 */

import type { User, Organization, NewsletterPreferences, Invitation } from "./types";
import type { AuthStore } from "./auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const TOKEN_KEY = "gaspe_api_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });
  return res.json() as Promise<T>;
}

interface AuthResponse {
  success?: boolean;
  error?: string;
  user?: User;
  token?: string;
  message?: string;
}

/**
 * API-backed AuthStore for production use with CF Worker backend.
 */
export class ApiAuthStore implements AuthStore {
  private cachedUser: User | null = null;
  private cachedUsers: User[] = [];

  getUsers(): User[] {
    return this.cachedUsers;
  }

  setUsers(_users: User[]): void {
    this.cachedUsers = _users;
  }

  getPasswords(): Record<string, string> {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPasswords(_passwords: Record<string, string>): void {
    // No-op: passwords managed server-side
  }

  getCurrentUser(): User | null {
    return this.cachedUser;
  }

  setCurrentUser(user: User | null): void {
    this.cachedUser = user;
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("gaspe_current_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("gaspe_current_user");
      }
    }
  }

  clearSession(): void {
    this.cachedUser = null;
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("gaspe_current_user");
    }
  }

  // ── Async API methods (used by AuthContext) ──

  static async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const res = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.error) return { success: false, error: res.error };
      if (res.token) setToken(res.token);
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
      const res = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.error) return { success: false, error: res.error };
      if (res.token) setToken(res.token);
      return { success: true, user: res.user ?? undefined };
    } catch {
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  }

  static async fetchCurrentUser(): Promise<User | null> {
    try {
      if (!getToken()) return null;
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
    setToken(null);
  }

  static async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await apiFetch<AuthResponse>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (res.error) return { success: false, error: res.error };
      return { success: true };
    } catch {
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  }

  static async resetPassword(token: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await apiFetch<AuthResponse>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      if (res.error) return { success: false, error: res.error };
      return { success: true };
    } catch {
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  }

  // ── Organizations ──

  static async fetchOrganizations(): Promise<Organization[]> {
    try {
      const res = await apiFetch<{ organizations?: Organization[] }>("/api/organizations");
      return res.organizations ?? [];
    } catch { return []; }
  }

  static async fetchOrganization(orgId: string): Promise<{ org: Organization | null; contacts: User[] }> {
    try {
      const res = await apiFetch<{ organization?: Organization; contacts?: User[] }>(`/api/organizations/${orgId}`);
      return { org: res.organization ?? null, contacts: res.contacts ?? [] };
    } catch { return { org: null, contacts: [] }; }
  }

  static async updateOrganization(orgId: string, data: Partial<Organization>): Promise<boolean> {
    try {
      const res = await apiFetch<{ success?: boolean }>(`/api/organizations/${orgId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return !!res.success;
    } catch { return false; }
  }

  // ── Invitations ──

  static async inviteContact(orgId: string, data: { email: string; name?: string; orgRole?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await apiFetch<AuthResponse>(`/api/organizations/${orgId}/invite`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.error) return { success: false, error: res.error };
      return { success: true };
    } catch { return { success: false, error: "Erreur de connexion" }; }
  }

  static async fetchInvitations(orgId: string): Promise<Invitation[]> {
    try {
      const res = await apiFetch<{ invitations?: Invitation[] }>(`/api/organizations/${orgId}/invitations`);
      return res.invitations ?? [];
    } catch { return []; }
  }

  static async acceptInvitation(token: string, data: { name: string; password: string; phone?: string }): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const res = await apiFetch<AuthResponse>(`/api/invitations/${token}/accept`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.error) return { success: false, error: res.error };
      if (res.token) setToken(res.token);
      return { success: true, user: res.user ?? undefined };
    } catch { return { success: false, error: "Erreur de connexion" }; }
  }

  // ── Newsletter Preferences ──

  static async fetchPreferences(): Promise<NewsletterPreferences | null> {
    try {
      const res = await apiFetch<{ preferences?: NewsletterPreferences }>("/api/preferences");
      return res.preferences ?? null;
    } catch { return null; }
  }

  static async updatePreferences(prefs: Partial<NewsletterPreferences>): Promise<boolean> {
    try {
      const res = await apiFetch<{ success?: boolean }>("/api/preferences", {
        method: "PATCH",
        body: JSON.stringify(prefs),
      });
      return !!res.success;
    } catch { return false; }
  }
}
