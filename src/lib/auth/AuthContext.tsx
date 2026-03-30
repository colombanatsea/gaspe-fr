"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { hashPassword, verifyPassword, isHashed } from "./hash";
import { readStore, writeStore, ensureSeeded, USERS_KEY, PASSWORDS_KEY, CURRENT_KEY } from "./storage";
import type { User, RegisterData, AuthContextValue } from "./types";

// Re-export all types and constants so existing imports from AuthContext keep working
export type { User, UserRole, ApplicationStatus, CompanyRole, MembershipStatus, Vessel, RegisterData, AuthContextValue } from "./types";
export { APPLICATION_STATUS_CONFIG, COMPANY_ROLES } from "./types";

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
        try {
          const users = JSON.parse(e.newValue ?? "[]") as User[];
          const fresh = users.find((u) => u.id === user.id);
          if (fresh) { setUser(fresh); writeStore(CURRENT_KEY, fresh); }
          else { setUser(null); localStorage.removeItem(CURRENT_KEY); }
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
