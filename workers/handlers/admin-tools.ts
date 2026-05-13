/**
 * Handlers admin-tools : export-all D1, seed hashes versioning, audit log.
 *
 * Tous master-admin uniquement (pas staff même avec toutes permissions).
 *
 * Extrait de `workers/api.ts` en J1 vague 2.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken } from "../lib/auth";
import { ensureAuditLogTable, logAudit } from "../lib/audit";
import type { Env } from "../lib/env";

// ════════════════════════════════════════════════════════════════════
//  Admin export-all (P2-4, G3 PRODUCTION-SAFETY-2026)
//  GET /api/admin/export-all
//
//  - Filtre les colonnes sensibles (password_hash, tokens reset, sessions).
//  - Content-Disposition: attachment pour download .json.
//  - Cas d'usage : audit DGCCRF, transfert légal, backup ad-hoc, RGPD
//    article 20 (portabilité), debug post-mortem.
// ════════════════════════════════════════════════════════════════════

export async function handleAdminExportAll(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Réservé à l'administrateur maître" }, corsHeaders, 403);
  }

  const exports: Array<{ name: string; query: string }> = [
    { name: "users", query: "SELECT id, email, name, role, organization_id, is_primary, approved, archived, created_at, updated_at, brevo_synced_at, suppleant_user_id, staff_permissions FROM users" },
    { name: "organizations", query: "SELECT * FROM organizations" },
    { name: "organization_vessels", query: "SELECT * FROM organization_vessels" },
    { name: "invitations", query: "SELECT id, organization_id, invited_by, email, name, org_role, expires_at, accepted, accepted_at, created_at FROM invitations" },
    { name: "newsletter_preferences", query: "SELECT * FROM newsletter_preferences" },
    { name: "newsletter", query: "SELECT id, email, archived, created_at FROM newsletter" },
    { name: "contact_messages", query: "SELECT * FROM contact_messages" },
    { name: "cms_pages", query: "SELECT * FROM cms_pages" },
    { name: "cms_documents", query: "SELECT * FROM cms_documents" },
    { name: "cms_revisions", query: "SELECT id, page_id, created_by, label, created_at FROM cms_revisions" },
    { name: "media_files", query: "SELECT id, key, content_type, size, created_by, created_at FROM media_files" },
    { name: "jobs", query: "SELECT * FROM jobs" },
    { name: "formations", query: "SELECT * FROM formations" },
    { name: "positions", query: "SELECT * FROM positions" },
    { name: "medical_visits", query: "SELECT * FROM medical_visits" },
    { name: "fleet_validation_campaigns", query: "SELECT * FROM fleet_validation_campaigns" },
    { name: "validation_history", query: "SELECT * FROM validation_history" },
    { name: "validation_email_sent", query: "SELECT * FROM validation_email_sent" },
    { name: "votes", query: "SELECT * FROM votes" },
    { name: "vote_responses", query: "SELECT * FROM vote_responses" },
    { name: "nl_drafts", query: "SELECT id, subject, status, created_by, created_at, updated_at FROM nl_drafts" },
    { name: "nl_sends", query: "SELECT id, draft_id, recipients_count, sent_at FROM nl_sends" },
    { name: "_migrations_applied", query: "SELECT * FROM _migrations_applied" },
  ];

  const tables: Record<string, unknown[]> = {};
  const errors: Record<string, string> = {};

  for (const exp of exports) {
    try {
      const { results } = await env.DB.prepare(exp.query).all<Record<string, unknown>>();
      tables[exp.name] = results ?? [];
    } catch (err) {
      tables[exp.name] = [];
      errors[exp.name] = err instanceof Error ? err.message : String(err);
    }
  }

  const counts: Record<string, number> = {};
  for (const [name, rows] of Object.entries(tables)) {
    counts[name] = Array.isArray(rows) ? rows.length : 0;
  }

  const exportPayload = {
    exported_at: new Date().toISOString(),
    exported_by: { id: payload.sub, email: payload.email ?? null },
    version: "1.0",
    note: "Export exhaustif D1 GASPE / ACF. Colonnes sensibles (password_hash, tokens, body emails) exclues. À usage interne / audit / RGPD article 20.",
    counts,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    tables,
  };

  const filename = `gaspe-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

// ════════════════════════════════════════════════════════════════════
//  Seed hashes versionning (P2-1, migration 0037)
//  GET  /api/admin/seed-hashes → liste les hashes en D1 (admin only).
//  POST /api/admin/seed-hashes → enregistre un batch de hashes.
//
//  Usage : `npx tsx scripts/compute-seed-hashes.ts --post` après chaque
//  release qui modifie un seed. Permet de détecter au déploiement si
//  un seed a été modifié depuis la dernière validation (drift).
// ════════════════════════════════════════════════════════════════════

async function ensureSeedHashesTable(env: Env): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS seed_hashes (
      seed_name TEXT PRIMARY KEY,
      sha256 TEXT NOT NULL,
      byte_size INTEGER,
      recorded_by TEXT,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT
    )
  `).run().catch(() => { /* best-effort */ });
}

export async function handleSeedHashesList(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Réservé à l'administrateur maître" }, corsHeaders, 403);
  }
  await ensureSeedHashesTable(env);
  try {
    const { results } = await env.DB.prepare(
      "SELECT seed_name, sha256, byte_size, recorded_by, recorded_at, notes FROM seed_hashes ORDER BY seed_name",
    ).all<{ seed_name: string; sha256: string; byte_size: number; recorded_by: string | null; recorded_at: string; notes: string | null }>();
    return json({ hashes: results ?? [] }, corsHeaders);
  } catch {
    return json({ hashes: [] }, corsHeaders);
  }
}

export async function handleSeedHashesUpsert(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Réservé à l'administrateur maître" }, corsHeaders, 403);
  }
  await ensureSeedHashesTable(env);

  let body: { hashes?: Array<{ name: string; sha256: string; byte_size?: number; notes?: string }> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Body JSON invalide" }, corsHeaders, 400);
  }
  if (!body.hashes || !Array.isArray(body.hashes)) {
    return json({ error: "Champ 'hashes' (array) requis" }, corsHeaders, 400);
  }

  let upserted = 0;
  for (const h of body.hashes) {
    if (typeof h.name !== "string" || typeof h.sha256 !== "string") continue;
    if (!/^[a-f0-9]{64}$/i.test(h.sha256)) continue;
    try {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO seed_hashes
          (seed_name, sha256, byte_size, recorded_by, recorded_at, notes)
        VALUES (?, ?, ?, ?, datetime('now'), ?)
      `).bind(
        h.name.slice(0, 64),
        h.sha256.toLowerCase(),
        typeof h.byte_size === "number" ? h.byte_size : null,
        payload.sub,
        h.notes ?? null,
      ).run();
      upserted++;
    } catch (err) {
      console.error("[seed-hashes] upsert failed for", h.name, err instanceof Error ? err.message : err);
    }
  }

  await logAudit(
    env, request,
    { id: String(payload.sub), email: payload.email ?? null, role: payload.role },
    "seed_hashes.upsert", "seed_hashes", null, null,
    { upserted, total: body.hashes.length },
  );

  return json({ success: true, upserted, total: body.hashes.length }, corsHeaders);
}

// ════════════════════════════════════════════════════════════════════
//  Audit log liste (UI admin, G3 P2-3 UI)
//  GET /api/admin/audit-log?limit=N&offset=O&action=X&entity_type=Y
// ════════════════════════════════════════════════════════════════════

export async function handleAuditLogList(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Réservé à l'administrateur maître" }, corsHeaders, 403);
  }
  await ensureAuditLogTable(env);

  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 500);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);
  const action = url.searchParams.get("action");
  const entityType = url.searchParams.get("entity_type");

  const wheres: string[] = [];
  const binds: unknown[] = [];
  if (action) { wheres.push("action = ?"); binds.push(action); }
  if (entityType) { wheres.push("entity_type = ?"); binds.push(entityType); }
  const whereSql = wheres.length > 0 ? `WHERE ${wheres.join(" AND ")}` : "";

  const sql = `
    SELECT id, user_id, user_email, user_role, action, entity_type, entity_id,
           ip, user_agent, created_at,
           CASE WHEN before_json IS NULL THEN 0 ELSE LENGTH(before_json) END AS before_len,
           CASE WHEN after_json IS NULL THEN 0 ELSE LENGTH(after_json) END AS after_len
    FROM audit_log
    ${whereSql}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  binds.push(limit, offset);

  try {
    const { results } = await env.DB.prepare(sql).bind(...binds).all();
    const countSql = `SELECT COUNT(*) AS total FROM audit_log ${whereSql}`;
    const countBinds = binds.slice(0, binds.length - 2);
    const totalRow = await env.DB.prepare(countSql).bind(...countBinds).first<{ total: number }>();
    return json({
      entries: results ?? [],
      total: totalRow?.total ?? 0,
      limit, offset,
    }, corsHeaders);
  } catch {
    return json({ entries: [], total: 0, limit, offset }, corsHeaders);
  }
}
