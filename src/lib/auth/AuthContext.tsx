"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { hashPassword, verifyPassword, isHashed } from "./hash";

/* ---------- Types ---------- */

export type UserRole = "admin" | "adherent" | "candidat";

export type ApplicationStatus =
  | "pending"      // Envoyée
  | "viewed"       // Vue par l'entreprise
  | "shortlisted"  // Présélectionnée
  | "interview"    // Entretien planifié
  | "accepted"     // Acceptée
  | "rejected";    // Refusée

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: "teal" | "blue" | "warm" | "green" | "neutral"; icon: string }> = {
  pending:     { label: "Envoyée",        variant: "neutral", icon: "clock" },
  viewed:      { label: "Vue",            variant: "blue",    icon: "eye" },
  shortlisted: { label: "Présélectionnée", variant: "teal",   icon: "star" },
  interview:   { label: "Entretien",      variant: "warm",    icon: "calendar" },
  accepted:    { label: "Acceptée",       variant: "green",   icon: "check" },
  rejected:    { label: "Refusée",        variant: "neutral",  icon: "x" },
};

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
  applications?: { offerId: string; date: string; status: ApplicationStatus; message?: string }[];
  experience?: string;
  certifications?: string;
  cvFilename?: string;
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
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

const ADMIN_SETTINGS_KEY = "gaspe_admin_settings";

interface AdminSettings {
  email: string;
  name: string;
}

function getAdminSettings(): AdminSettings {
  const stored = readStore<AdminSettings | null>(ADMIN_SETTINGS_KEY, null);
  return stored ?? { email: "admin@gaspe.fr", name: "Administrateur GASPE" };
}

const ADMIN_SEED: User = {
  id: "admin-001",
  email: getAdminSettings().email,
  name: getAdminSettings().name,
  role: "admin",
  approved: true,
  createdAt: "2025-01-01T00:00:00.000Z",
};

async function ensureSeeded() {
  const users = readStore<User[]>(USERS_KEY, []);
  const passwords = readStore<Record<string, string>>(PASSWORDS_KEY, {});
  if (!users.find((u) => u.id === ADMIN_SEED.id)) {
    users.push(ADMIN_SEED);
    // Hash the default password
    const hashed = await hashPassword("admin123", ADMIN_SEED.email);
    passwords[ADMIN_SEED.id] = hashed;
    writeStore(USERS_KEY, users);
    writeStore(PASSWORDS_KEY, passwords);
  } else {
    // Migrate plaintext passwords to hashed
    let changed = false;
    for (const user of users) {
      const pwd = passwords[user.id];
      if (pwd && !isHashed(pwd)) {
        passwords[user.id] = await hashPassword(pwd, user.email);
        changed = true;
      }
    }
    if (changed) writeStore(PASSWORDS_KEY, passwords);
  }
}

/* ---------- Context ---------- */

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate on mount
  useEffect(() => {
    async function init() {
      await ensureSeeded();
      const current = readStore<User | null>(CURRENT_KEY, null);
      if (current) {
        const users = readStore<User[]>(USERS_KEY, []);
        const fresh = users.find((u) => u.id === current.id) ?? null;
        setUser(fresh);
      }
      setReady(true);
    }
    init();
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

  const login = useCallback(async (email: string, password: string) => {
    const users = readStore<User[]>(USERS_KEY, []);
    const passwords = readStore<Record<string, string>>(PASSWORDS_KEY, {});
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { success: false, error: "Aucun compte trouvé avec cet email." };
    const storedPwd = passwords[found.id];
    if (!storedPwd) return { success: false, error: "Mot de passe incorrect." };
    // Support both hashed and legacy plaintext during migration
    const valid = isHashed(storedPwd)
      ? await verifyPassword(password, found.email, storedPwd)
      : storedPwd === password;
    if (!valid) return { success: false, error: "Mot de passe incorrect." };
    // Migrate plaintext to hashed on successful login
    if (!isHashed(storedPwd)) {
      passwords[found.id] = await hashPassword(password, found.email);
      writeStore(PASSWORDS_KEY, passwords);
    }
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

  const register = useCallback(async (data: RegisterData) => {
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
        ? { currentPosition: data.currentPosition, desiredPosition: data.desiredPosition, savedOffers: [], applications: [], experience: "", certifications: "", cvFilename: "" }
        : {}),
    };

    users.push(newUser);
    passwords[id] = await hashPassword(data.password, data.email);
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
