"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { hashPassword, verifyPassword, isHashed } from "./hash";
import { getAuthStore, USERS_KEY, CURRENT_KEY } from "./auth-store";
import { ensureSeeded } from "./storage";
import { safeParse, usersArraySchema, userSchema } from "@/lib/schemas";
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
      const store = getAuthStore();
      const current = store.getCurrentUser();
      if (current) {
        const users = store.getUsers();
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
        const parsed = safeParse(userSchema.nullable(), e.newValue, null);
        setUser(parsed);
      }
      if (e.key === USERS_KEY && user) {
        const users = safeParse(usersArraySchema, e.newValue, []);
        const fresh = users.find((u) => u.id === user.id);
        if (fresh) { setUser(fresh); getAuthStore().setCurrentUser(fresh); }
        else { setUser(null); getAuthStore().clearSession(); }
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const store = getAuthStore();
    const users = store.getUsers();
    const passwords = store.getPasswords();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { success: false, error: "Aucun compte trouvé avec cet email." };
    const storedPwd = passwords[found.id];
    if (!storedPwd) return { success: false, error: "Mot de passe incorrect." };
    const valid = isHashed(storedPwd)
      ? await verifyPassword(password, found.email, storedPwd)
      : storedPwd === password;
    if (!valid) return { success: false, error: "Mot de passe incorrect." };
    if (!isHashed(storedPwd)) {
      passwords[found.id] = await hashPassword(password, found.email);
      store.setPasswords(passwords);
    }
    if (found.role === "adherent" && !found.approved) {
      return { success: false, error: "Votre compte est en attente de validation par l'administrateur." };
    }
    setUser(found);
    store.setCurrentUser(found);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    getAuthStore().clearSession();
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const store = getAuthStore();
    const users = store.getUsers();
    const passwords = store.getPasswords();

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
    store.setUsers(users);
    store.setPasswords(passwords);

    if (data.role === "candidat") {
      setUser(newUser);
      store.setCurrentUser(newUser);
    }

    return { success: true };
  }, []);

  const getAllUsers = useCallback(() => {
    return getAuthStore().getUsers();
  }, []);

  const approveUser = useCallback((id: string) => {
    const store = getAuthStore();
    const users = store.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      users[idx].approved = true;
      store.setUsers(users);
      const current = store.getCurrentUser();
      if (current?.id === id) store.setCurrentUser(users[idx]);
    }
  }, []);

  const rejectUser = useCallback((id: string) => {
    const store = getAuthStore();
    const users = store.getUsers();
    const passwords = store.getPasswords();
    const filtered = users.filter((u) => u.id !== id);
    delete passwords[id];
    store.setUsers(filtered);
    store.setPasswords(passwords);
    const current = store.getCurrentUser();
    if (current?.id === id) store.clearSession();
  }, []);

  const updateUser = useCallback((updated: User) => {
    const store = getAuthStore();
    const users = store.getUsers();
    const idx = users.findIndex((u) => u.id === updated.id);
    if (idx >= 0) {
      users[idx] = updated;
      store.setUsers(users);
      if (user?.id === updated.id) {
        setUser(updated);
        store.setCurrentUser(updated);
      }
    }
  }, [user]);

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
