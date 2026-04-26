import type { User, StaffPermission } from "@/lib/auth/types";

/**
 * Vrai si l'utilisateur peut effectuer une action protégée par `permission` :
 * - `admin` (compte maître) : toujours vrai
 * - `staff` : vrai si la permission est dans `staffPermissions`
 * - autres rôles : faux
 *
 * Côté frontend, sert à griser/cacher les pages admin auxquelles le staff
 * n'a pas accès. Le Worker re-vérifie côté serveur (cf. requireStaffPermission).
 */
export function hasStaffPermission(user: User | null | undefined, permission: StaffPermission): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "staff") return false;
  return Array.isArray(user.staffPermissions) && user.staffPermissions.includes(permission);
}

/** Vrai si l'utilisateur est admin maître ou staff (peu importe les permissions). */
export function isStaffOrAdmin(user: User | null | undefined): boolean {
  return user?.role === "admin" || user?.role === "staff";
}
