"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

/* ---------- Types ---------- */

export type UserRole = "admin" | "adherent" | "candidat";

export type CompanyRole =
  | "dirigeant"
  | "exploitation"
  | "armement"
  | "paie"
  | "technique"
  | "logistique"
  | "achats"
  | "formation";

export const COMPANY_ROLES: { value: CompanyRole; label: string }[] = [
  { value: "dirigeant", label: "Dirigeant" },
  { value: "exploitation", label: "Exploitation" },
  { value: "armement", label: "Armement" },
  { value: "paie", label: "Paie" },
  { value: "technique", label: "Technique" },
  { value: "logistique", label: "Logistique" },
  { value: "achats", label: "Achats" },
  { value: "formation", label: "Formation" },
];

export interface Vessel {
  id: string;
  name: string;
  imo?: string;
  ums?: string;
  size?: string;
}

export type MembershipStatus = "due" | "paid" | "pending";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  phone?: string;
  approved?: boolean;
  archived?: boolean;
  /** Adherent-specific */
  companyRole?: CompanyRole;
  companyDescription?: string;
  companyLogo?: string; // base64 data URL
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  vessels?: Vessel[];
  membershipStatus?: MembershipStatus;
  /** Candidat-specific */
  currentPosition?: string;
  desiredPosition?: string;
  preferredZone?: string;
  savedOffers?: string[];
  applications?: { offerId: string; date: string; status: string; message?: string }[];
  /** Structured certifications (replaces freetext) */
  structuredCertifications?: {
    certId: string;
    obtainedDate?: string;
    expiryDate?: string;
    reference?: string;
    verified?: boolean;
  }[];
  /** Sea service history */
  seaService?: {
    id: string;
    vesselName: string;
    vesselType?: string;
    rank: string;
    startDate: string;
    endDate?: string;
  }[];
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  register: (data: RegisterData) => { success: boolean; error?: string };
  getAllUsers: () => User[];
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
  updateUser: (updated: User) => void;
}

export type RegisterData = {
  role: "adherent";
  name: string;
  email: string;
  password: string;
  phone: string;
  company: string;
} | {
  role: "candidat";
  name: string;
  email: string;
  password: string;
  phone: string;
  currentPosition?: string;
  desiredPosition?: string;
};

/* ---------- Storage helpers ---------- */

const USERS_KEY = "gaspe_users";
const PASSWORDS_KEY = "gaspe_passwords";
const CURRENT_KEY = "gaspe_current_user";

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Seed admin ---------- */

const ADMIN_SEED: User = {
  id: "admin-001",
  email: "admin@gaspe.fr",
  name: "Administrateur GASPE",
  role: "admin",
  approved: true,
  createdAt: "2025-01-01T00:00:00.000Z",
};

function ensureSeeded() {
  const users = readStore<User[]>(USERS_KEY, []);
  const passwords = readStore<Record<string, string>>(PASSWORDS_KEY, {});
  if (!users.find((u) => u.id === ADMIN_SEED.id)) {
    users.push(ADMIN_SEED);
    passwords[ADMIN_SEED.id] = "admin123";
    writeStore(USERS_KEY, users);
    writeStore(PASSWORDS_KEY, passwords);
  }
}

/* ---------- Context ---------- */

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate on mount
  useEffect(() => {
    ensureSeeded();
    const current = readStore<User | null>(CURRENT_KEY, null);
    if (current) {
      // Re-read from store to get latest data
      const users = readStore<User[]>(USERS_KEY, []);
      const fresh = users.find((u) => u.id === current.id) ?? null;
      setUser(fresh);
    }
    setReady(true);
  }, []);

  // Sync across tabs via storage event
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === CURRENT_KEY) {
        if (!e.newValue) { setUser(null); return; }
        try { setUser(JSON.parse(e.newValue) as User); } catch { /* ignore */ }
      }
      if (e.key === USERS_KEY && user) {
        // Re-read fresh user data if users array changed (e.g. admin approved/archived)
        try {
          const users = JSON.parse(e.newValue ?? "[]") as User[];
          const fresh = users.find((u) => u.id === user.id);
          if (fresh) { setUser(fresh); writeStore(CURRENT_KEY, fresh); }
          else { setUser(null); localStorage.removeItem(CURRENT_KEY); } // user was deleted
        } catch { /* ignore */ }
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const login = useCallback((email: string, password: string) => {
    const users = readStore<User[]>(USERS_KEY, []);
    const passwords = readStore<Record<string, string>>(PASSWORDS_KEY, {});
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { success: false, error: "Aucun compte trouvé avec cet email." };
    if (passwords[found.id] !== password) return { success: false, error: "Mot de passe incorrect." };
    if (found.role === "adherent" && !found.approved) {
      return { success: false, error: "Votre compte est en attente de validation par l'administrateur." };
    }
    setUser(found);
    writeStore(CURRENT_KEY, found);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem(CURRENT_KEY);
  }, []);

  const register = useCallback((data: RegisterData) => {
    const users = readStore<User[]>(USERS_KEY, []);
    const passwords = readStore<Record<string, string>>(PASSWORDS_KEY, {});

    if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: "Un compte existe déjà avec cet email." };
    }

    const id = `${data.role}-${Date.now()}`;
    const newUser: User = {
      id,
      email: data.email,
      name: data.name,
      role: data.role,
      phone: data.phone,
      approved: data.role === "candidat" ? true : false,
      createdAt: new Date().toISOString(),
      ...(data.role === "adherent" ? { company: data.company } : {}),
      ...(data.role === "candidat"
        ? { currentPosition: data.currentPosition, desiredPosition: data.desiredPosition, savedOffers: [], applications: [] }
        : {}),
    };

    users.push(newUser);
    passwords[id] = data.password;
    writeStore(USERS_KEY, users);
    writeStore(PASSWORDS_KEY, passwords);

    // Auto-login candidat
    if (data.role === "candidat") {
      setUser(newUser);
      writeStore(CURRENT_KEY, newUser);
    }

    return { success: true };
  }, []);

  const getAllUsers = useCallback(() => {
    return readStore<User[]>(USERS_KEY, []);
  }, []);

  const approveUser = useCallback((id: string) => {
    const users = readStore<User[]>(USERS_KEY, []);
    const idx = users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      users[idx].approved = true;
      writeStore(USERS_KEY, users);
      // Update current_user if it's the same user (e.g. they're logged in another tab)
      const current = readStore<User | null>(CURRENT_KEY, null);
      if (current?.id === id) writeStore(CURRENT_KEY, users[idx]);
    }
  }, []);

  const rejectUser = useCallback((id: string) => {
    const users = readStore<User[]>(USERS_KEY, []);
    const passwords = readStore<Record<string, string>>(PASSWORDS_KEY, {});
    const filtered = users.filter((u) => u.id !== id);
    delete passwords[id];
    writeStore(USERS_KEY, filtered);
    writeStore(PASSWORDS_KEY, passwords);
    // Clear current_user if the rejected user is logged in
    const current = readStore<User | null>(CURRENT_KEY, null);
    if (current?.id === id) localStorage.removeItem(CURRENT_KEY);
  }, []);

  const updateUser = useCallback((updated: User) => {
    const users = readStore<User[]>(USERS_KEY, []);
    const idx = users.findIndex((u) => u.id === updated.id);
    if (idx >= 0) {
      users[idx] = updated;
      writeStore(USERS_KEY, users);
      if (user?.id === updated.id) {
        setUser(updated);
        writeStore(CURRENT_KEY, updated);
      }
    }
  }, [user]);

  // Don't render children until hydrated to prevent mismatch
  if (!ready) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role ?? null,
        login,
        logout,
        register,
        getAllUsers,
        approveUser,
        rejectUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
