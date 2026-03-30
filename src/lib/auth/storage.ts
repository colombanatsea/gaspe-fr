/* ------------------------------------------------------------------ */
/*  Auth storage — admin seeding + legacy helpers                      */
/*  Uses AuthStore interface for all read/write operations.            */
/* ------------------------------------------------------------------ */

import type { User } from "./types";
import { hashPassword, isHashed } from "./hash";
import { getAuthStore } from "./auth-store";

// Re-export for consumers
export { getAuthStore } from "./auth-store";
export { USERS_KEY, PASSWORDS_KEY, CURRENT_KEY } from "./auth-store";

const ADMIN_SETTINGS_KEY = "gaspe_admin_settings";

interface AdminSettings {
  email: string;
  name: string;
}

function getAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return { email: "admin@gaspe.fr", name: "Administrateur GASPE" };
  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (!raw) return { email: "admin@gaspe.fr", name: "Administrateur GASPE" };
    const parsed = JSON.parse(raw);
    if (typeof parsed?.email === "string" && typeof parsed?.name === "string") return parsed;
    return { email: "admin@gaspe.fr", name: "Administrateur GASPE" };
  } catch {
    return { email: "admin@gaspe.fr", name: "Administrateur GASPE" };
  }
}

const ADMIN_SEED: User = {
  id: "admin-001",
  email: getAdminSettings().email,
  name: getAdminSettings().name,
  role: "admin",
  approved: true,
  createdAt: "2025-01-01T00:00:00.000Z",
};

export async function ensureSeeded() {
  const store = getAuthStore();
  const users = store.getUsers();
  const passwords = store.getPasswords();
  if (!users.find((u) => u.id === ADMIN_SEED.id)) {
    users.push(ADMIN_SEED);
    const hashed = await hashPassword("admin123", ADMIN_SEED.email);
    passwords[ADMIN_SEED.id] = hashed;
    store.setUsers(users);
    store.setPasswords(passwords);
  } else {
    let changed = false;
    for (const user of users) {
      const pwd = passwords[user.id];
      if (pwd && !isHashed(pwd)) {
        passwords[user.id] = await hashPassword(pwd, user.email);
        changed = true;
      }
    }
    if (changed) store.setPasswords(passwords);
  }
}
