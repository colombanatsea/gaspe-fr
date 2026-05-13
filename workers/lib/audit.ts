/**
 * Audit log applicatif (P2-3 PRODUCTION-SAFETY-2026, migration 0035).
 *
 * Helper `logAudit` best-effort : ne fait JAMAIS échouer le caller.
 * Si la table `audit_log` n'existe pas (déploiement avant migration),
 * le log est ignoré silencieusement.
 *
 * Extrait de `workers/api.ts` en J1 vague 2 pour partage cross-modules
 * (organization.update, job.delete, formation.delete, medical_visit.delete,
 * seed_hashes.upsert).
 */

import type { Env } from "./env";

export interface AuditUser {
  id?: string | null;
  email?: string | null;
  role?: string | null;
}

/** Crée la table `audit_log` si elle n'existe pas. Best-effort. */
export async function ensureAuditLogTable(env: Env): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT, user_email TEXT, user_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      before_json TEXT, after_json TEXT,
      ip TEXT, user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run().catch(() => { /* table peut exister, ignore */ });
}

const MAX_AUDIT_PAYLOAD_LEN = 1_000_000; // 1 MB par snapshot, au-delà tronqué

export function truncateForAudit(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    const s = JSON.stringify(value);
    if (s.length > MAX_AUDIT_PAYLOAD_LEN) {
      return JSON.stringify({ _truncated: true, length: s.length, preview: s.slice(0, 500) });
    }
    return s;
  } catch {
    return null;
  }
}

/**
 * Loggue un événement d'audit applicatif. Best-effort : un échec ne
 * remonte jamais d'exception au caller métier.
 */
export async function logAudit(
  env: Env,
  request: Request,
  user: AuditUser | null,
  action: string,
  entityType: string,
  entityId: string | null,
  before: unknown,
  after: unknown,
): Promise<void> {
  try {
    await ensureAuditLogTable(env);
    const ip = request.headers.get("CF-Connecting-IP") ?? request.headers.get("x-forwarded-for") ?? null;
    const ua = (request.headers.get("user-agent") ?? "").slice(0, 500) || null;
    await env.DB.prepare(`
      INSERT INTO audit_log (
        user_id, user_email, user_role, action, entity_type, entity_id,
        before_json, after_json, ip, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user?.id ?? null,
      user?.email ?? null,
      user?.role ?? null,
      action,
      entityType,
      entityId,
      truncateForAudit(before),
      truncateForAudit(after),
      ip,
      ua,
    ).run();
  } catch (err) {
    console.error("[audit] failed to log:", err instanceof Error ? err.message : err);
  }
}
