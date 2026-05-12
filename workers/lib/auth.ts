/**
 * Helpers d'authentification Worker (extraction de token, vérification
 * de permissions staff).
 *
 * Extrait de `workers/api.ts` (session J1, refactor split monolithique).
 */

import { verifyJwt } from "../jwt";
import { json } from "./json";
import type { Env } from "./env";

/**
 * Extrait le token JWT d'une requête. Cherche d'abord dans le header
 * Authorization (Bearer), puis dans le cookie `gaspe_token`.
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/gaspe_token=([^;]+)/);
  return match?.[1] ?? null;
}

/** Parse la chaîne JSON des permissions staff (tolère null / format invalide). */
export function parseStaffPerms(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : null;
  } catch {
    return null;
  }
}

/**
 * Vérifie que la requête est authentifiée ET que l'utilisateur a la
 * permission demandée (ou est admin maître).
 *
 * Retourne `{ userId }` en succès, `{ error: Response }` sinon.
 */
export async function requireStaffPermission(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  permission: string,
): Promise<{ userId: string } | { error: Response }> {
  const token = extractToken(request);
  if (!token) return { error: json({ error: "Non authentifié" }, corsHeaders, 401) };
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return { error: json({ error: "Token invalide" }, corsHeaders, 401) };

  if (payload.role === "admin") return { userId: String(payload.sub) };

  if (payload.role === "staff") {
    try {
      const row = await env.DB
        .prepare("SELECT staff_permissions FROM users WHERE id = ?")
        .bind(payload.sub)
        .first<{ staff_permissions: string | null }>();
      const perms = parseStaffPerms(row?.staff_permissions ?? null);
      if (perms && perms.includes(permission)) return { userId: String(payload.sub) };
    } catch { /* ignore – fail closed below */ }
  }
  return { error: json({ error: "Accès refusé : permission requise" }, corsHeaders, 403) };
}
