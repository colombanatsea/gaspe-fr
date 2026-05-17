/**
 * Handlers positions / actualités : CRUD + soft-delete + ensure-table.
 *
 * Permission staff `manage_positions` requise pour POST/PATCH/DELETE.
 * Liste publique : seulement publiées + non archivées ; admin/staff voient tout.
 * Le module exporte aussi `DbPosition`, `toFrontendPosition` et
 * `ensurePositionsTable` car les handlers feed.xml et sitemap-positions.xml
 * (toujours dans `workers/api.ts`) les réutilisent.
 *
 * Extrait de `workers/api.ts` en J1 vague 5.c.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken, requireStaffPermission } from "../lib/auth";
import { sanitize, sanitizeRichHtml } from "../lib/sanitize";
import { safeJsonParse, slugify } from "../lib/db-helpers";
import type { Env } from "../lib/env";

export interface DbPosition {
  id: string; slug: string; title: string;
  excerpt: string | null; content: string | null;
  category: string | null; date: string | null;
  cover_image_url: string | null;
  attachment_url: string | null;
  tags_json: string | null;
  published: number;
  is_archived: number;
  created_by: string | null;
  created_at: string; updated_at: string;
}

export function toFrontendPosition(row: DbPosition) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    category: row.category ?? "Position",
    date: row.date ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    attachmentUrl: row.attachment_url ?? undefined,
    tags: safeJsonParse<string[]>(row.tags_json, []),
    published: row.published === 1,
    isArchived: row.is_archived === 1,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function ensurePositionsTable(env: Env): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS positions (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT, content TEXT,
      category TEXT, date TEXT,
      cover_image_url TEXT, attachment_url TEXT,
      tags_json TEXT,
      published INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}

export async function handlePositionsList(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  await ensurePositionsTable(env);
  // Public : seulement publiées + non archivées. Admin/staff : tout.
  const token = extractToken(request);
  let isPrivileged = false;
  if (token) {
    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (payload?.role === "admin" || payload?.role === "staff") isPrivileged = true;
  }
  const query = isPrivileged
    ? "SELECT * FROM positions ORDER BY date DESC, created_at DESC"
    : "SELECT * FROM positions WHERE published = 1 AND is_archived = 0 ORDER BY date DESC, created_at DESC";
  try {
    const { results } = await env.DB.prepare(query).all<DbPosition>();
    return json({ positions: (results ?? []).map(toFrontendPosition) }, corsHeaders);
  } catch {
    return json({ positions: [] }, corsHeaders);
  }
}

export async function handleGetPosition(
  request: Request, env: Env, corsHeaders: Record<string, string>, slugOrId: string,
) {
  await ensurePositionsTable(env);
  const row = await env.DB.prepare(
    "SELECT * FROM positions WHERE slug = ? OR id = ?",
  ).bind(slugOrId, slugOrId).first<DbPosition>();
  if (!row) return json({ error: "Position introuvable" }, corsHeaders, 404);
  if (row.published !== 1 || row.is_archived === 1) {
    const token = extractToken(request);
    let isPrivileged = false;
    if (token) {
      const payload = await verifyJwt(token, env.JWT_SECRET);
      if (payload?.role === "admin" || payload?.role === "staff") isPrivileged = true;
    }
    if (!isPrivileged) return json({ error: "Position introuvable" }, corsHeaders, 404);
  }
  return json({ position: toFrontendPosition(row) }, corsHeaders);
}

export async function handleCreatePosition(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_positions");
  if ("error" in auth) return auth.error;
  await ensurePositionsTable(env);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  const title = sanitize(String(body.title ?? ""));
  if (!title) return json({ error: "title requis" }, corsHeaders, 400);

  const rawSlug = String(body.slug ?? "").trim() || slugify(title, 64);
  const slug = sanitize(rawSlug);
  const id = String(body.id ?? `pos-${slug}-${Date.now().toString(36)}`);

  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO positions (
        id, slug, title, excerpt, content,
        category, date, cover_image_url, attachment_url,
        tags_json, published, is_archived, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, slug, title,
      sanitize(String(body.excerpt ?? "")),
      sanitizeRichHtml(String(body.content ?? "")),
      sanitize(String(body.category ?? "Position")),
      String(body.date ?? "") || null,
      sanitize(String(body.coverImageUrl ?? "")),
      body.attachmentUrl ? sanitize(String(body.attachmentUrl)) : null,
      Array.isArray(body.tags) ? JSON.stringify(body.tags) : null,
      body.published === true ? 1 : 0,
      body.isArchived === true ? 1 : 0,
      auth.userId,
      now, now,
    ).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return json({ error: "ID/Slug déjà utilisé" }, corsHeaders, 409);
    return json({ error: "Erreur création position" }, corsHeaders, 500);
  }

  const row = await env.DB.prepare("SELECT * FROM positions WHERE id = ?")
    .bind(id).first<DbPosition>();
  return json({ position: row ? toFrontendPosition(row) : null }, corsHeaders, 201);
}

export async function handleUpdatePosition(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_positions");
  if ("error" in auth) return auth.error;
  await ensurePositionsTable(env);

  const existing = await env.DB.prepare("SELECT * FROM positions WHERE id = ?")
    .bind(id).first<DbPosition>();
  if (!existing) return json({ error: "Position introuvable" }, corsHeaders, 404);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  const fieldMap: Record<string, string> = {
    slug: "slug", title: "title", excerpt: "excerpt", content: "content",
    category: "category", date: "date",
    coverImageUrl: "cover_image_url", attachmentUrl: "attachment_url",
    tags: "tags_json",
    published: "published", isArchived: "is_archived",
  };
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (!(key in body)) continue;
    let v = body[key];
    if (col === "published" || col === "is_archived") v = v ? 1 : 0;
    else if (col === "content") v = sanitizeRichHtml(String(v ?? ""));
    else if (col === "tags_json") v = Array.isArray(v) ? JSON.stringify(v) : null;
    else if (typeof v === "string") v = sanitize(v);
    sets.push(`${col} = ?`);
    vals.push(v);
  }
  if (sets.length === 0) return json({ position: toFrontendPosition(existing) }, corsHeaders);

  sets.push("updated_at = ?");
  vals.push(new Date().toISOString());
  vals.push(id);

  try {
    await env.DB.prepare(`UPDATE positions SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...vals).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return json({ error: "Slug déjà utilisé" }, corsHeaders, 409);
    return json({ error: "Erreur mise à jour" }, corsHeaders, 500);
  }

  const row = await env.DB.prepare("SELECT * FROM positions WHERE id = ?")
    .bind(id).first<DbPosition>();
  return json({ position: row ? toFrontendPosition(row) : null }, corsHeaders);
}

export async function handleDeletePosition(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_positions");
  if ("error" in auth) return auth.error;
  await ensurePositionsTable(env);

  const existing = await env.DB.prepare("SELECT id FROM positions WHERE id = ?")
    .bind(id).first<{ id: string }>();
  if (!existing) return json({ error: "Position introuvable" }, corsHeaders, 404);

  // Soft-delete (preserve traçabilité)
  await env.DB.prepare(
    "UPDATE positions SET is_archived = 1, published = 0, updated_at = ? WHERE id = ?",
  ).bind(new Date().toISOString(), id).run();

  return json({ success: true, archived: true }, corsHeaders);
}
