/* ------------------------------------------------------------------ */
/*  Auth storage — localStorage helpers + admin seeding                */
/* ------------------------------------------------------------------ */

import type { User } from "./types";
import { hashPassword, isHashed } from "./hash";

export const USERS_KEY = "gaspe_users";
export const PASSWORDS_KEY = "gaspe_passwords";
export const CURRENT_KEY = "gaspe_current_user";
const ADMIN_SETTINGS_KEY = "gaspe_admin_settings";

interface AdminSettings {
  email: string;
  name: string;
}

/* ── Generic localStorage read/write ── */

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

/* ── Admin settings ── */

function getAdminSettings(): AdminSettings {
  const stored = readStore<AdminSettings | null>(ADMIN_SETTINGS_KEY, null);
  return stored ?? { email: "admin@gaspe.fr", name: "Administrateur GASPE" };
}

/* ── Admin seed ── */

const ADMIN_SEED: User = {
  id: "admin-001",
  email: getAdminSettings().email,
  name: getAdminSettings().name,
  role: "admin",
  approved: true,
  createdAt: "2025-01-01T00:00:00.000Z",
};

export async function ensureSeeded() {
  const users = readStore<User[]>(USERS_KEY, []);
  const passwords = readStore<Record<string, string>>(PASSWORDS_KEY, {});
  if (!users.find((u) => u.id === ADMIN_SEED.id)) {
    users.push(ADMIN_SEED);
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
