/**
 * Handlers formations : CRUD + register/unregister.
 *
 * Permission staff `manage_formations` requise pour POST/PATCH/DELETE.
 * Register / unregister ouverts à tout JWT (adhérent/candidat) pour
 * gérer son inscription sans permission staff.
 *
 * Extrait de `workers/api.ts` en J1 vague 5.d.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken, requireStaffPermission, requireJwt } from "../lib/auth";
import { sanitize, sanitizeRichHtml } from "../lib/sanitize";
import { safeJsonParse, slugify } from "../lib/db-helpers";
import { logAudit } from "../lib/audit";
import type { Env } from "../lib/env";

interface DbFormation {
  id: string; slug: string | null; title: string;
  description: string | null; content: string | null;
  organizer: string | null;
  start_date: string | null; end_date: string | null;
  location: string | null; duration: string | null;
  capacity: number; enrolled: number;
  target_audience: string | null; prerequisites: string | null;
  price: string | null; contact_email: string | null;
  status: string;
  category: string | null;
  modality: string | null;
  schedule_json: string | null;
  attachments_json: string | null;
  registrations_json: string | null;
  registration_deadline: string | null;
  is_published: number; is_archived: number;
  created_by: string | null;
  created_at: string; updated_at: string;
}

function toFrontendFormation(row: DbFormation) {
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    title: row.title,
    description: row.description ?? "",
    content: row.content ?? "",
    organizer: row.organizer ?? "",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    location: row.location ?? "",
    duration: row.duration ?? "",
    capacity: row.capacity ?? 0,
    enrolled: row.enrolled ?? 0,
    targetAudience: row.target_audience ?? "",
    prerequisites: row.prerequisites ?? "",
    price: row.price ?? "",
    contactEmail: row.contact_email ?? "",
    status: row.status ?? "open",
    category: row.category ?? "",
    modality: row.modality ?? undefined,
    schedule: safeJsonParse<unknown[]>(row.schedule_json, []),
    attachments: safeJsonParse<unknown[]>(row.attachments_json, []),
    registrations: safeJsonParse<string[]>(row.registrations_json, []),
    registrationDeadline: row.registration_deadline ?? undefined,
    isPublished: row.is_published === 1,
    isArchived: row.is_archived === 1,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureFormationsTable(env: Env): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS formations (
      id TEXT PRIMARY KEY,
      slug TEXT,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      organizer TEXT,
      start_date TEXT, end_date TEXT,
      location TEXT, duration TEXT,
      capacity INTEGER DEFAULT 0,
      enrolled INTEGER DEFAULT 0,
      target_audience TEXT, prerequisites TEXT,
      price TEXT, contact_email TEXT,
      status TEXT DEFAULT 'open',
      category TEXT,
      modality TEXT,
      schedule_json TEXT,
      attachments_json TEXT,
      registrations_json TEXT,
      registration_deadline TEXT,
      is_published INTEGER DEFAULT 1,
      is_archived INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}

export async function handleFormationsList(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  await ensureFormationsTable(env);
  // Public : seulement les publiées + non archivées. Admin/staff : tout.
  const token = extractToken(request);
  let isPrivileged = false;
  if (token) {
    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (payload?.role === "admin") isPrivileged = true;
    if (!isPrivileged && payload?.role === "staff") {
      // staff voit tout aussi (consultation)
      isPrivileged = true;
    }
  }
  const query = isPrivileged
    ? "SELECT * FROM formations ORDER BY start_date DESC, created_at DESC"
    : "SELECT * FROM formations WHERE is_published = 1 AND is_archived = 0 ORDER BY start_date DESC, created_at DESC";
  try {
    const { results } = await env.DB.prepare(query).all<DbFormation>();
    return json({ formations: (results ?? []).map(toFrontendFormation) }, corsHeaders);
  } catch {
    return json({ formations: [] }, corsHeaders);
  }
}

export async function handleGetFormation(
  request: Request, env: Env, corsHeaders: Record<string, string>, slugOrId: string,
) {
  await ensureFormationsTable(env);
  const row = await env.DB.prepare(
    "SELECT * FROM formations WHERE slug = ? OR id = ?",
  ).bind(slugOrId, slugOrId).first<DbFormation>();
  if (!row) return json({ error: "Formation introuvable" }, corsHeaders, 404);
  // Lecture publique uniquement si publiée et non archivée. Privilégiés : tout.
  if (row.is_published !== 1 || row.is_archived === 1) {
    const token = extractToken(request);
    let isPrivileged = false;
    if (token) {
      const payload = await verifyJwt(token, env.JWT_SECRET);
      if (payload?.role === "admin" || payload?.role === "staff") isPrivileged = true;
    }
    if (!isPrivileged) return json({ error: "Formation introuvable" }, corsHeaders, 404);
  }
  return json({ formation: toFrontendFormation(row) }, corsHeaders);
}

export async function handleCreateFormation(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_formations");
  if ("error" in auth) return auth.error;
  await ensureFormationsTable(env);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  const title = sanitize(String(body.title ?? ""));
  if (!title) return json({ error: "title requis" }, corsHeaders, 400);

  // Slug optionnel : généré depuis title si non fourni.
  const rawSlug = String(body.slug ?? "").trim() || slugify(title, 64);
  const slug = sanitize(rawSlug);
  const id = String(body.id ?? `form-${slug}-${Date.now().toString(36)}`);

  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO formations (
        id, slug, title, description, content, organizer,
        start_date, end_date, location, duration,
        capacity, enrolled, target_audience, prerequisites,
        price, contact_email, status, category,
        modality, schedule_json, attachments_json, registrations_json,
        registration_deadline, is_published, is_archived, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, slug, title,
      sanitize(String(body.description ?? "")),
      sanitizeRichHtml(String(body.content ?? "")),
      sanitize(String(body.organizer ?? "")),
      String(body.startDate ?? "") || null,
      String(body.endDate ?? "") || null,
      sanitize(String(body.location ?? "")),
      sanitize(String(body.duration ?? "")),
      Number(body.capacity ?? 0),
      Number(body.enrolled ?? 0),
      sanitize(String(body.targetAudience ?? "")),
      sanitize(String(body.prerequisites ?? "")),
      sanitize(String(body.price ?? "")),
      sanitize(String(body.contactEmail ?? "")),
      sanitize(String(body.status ?? "open")),
      sanitize(String(body.category ?? "")),
      body.modality ? sanitize(String(body.modality)) : null,
      Array.isArray(body.schedule) ? JSON.stringify(body.schedule) : null,
      Array.isArray(body.attachments) ? JSON.stringify(body.attachments) : null,
      Array.isArray(body.registrations) ? JSON.stringify(body.registrations) : null,
      String(body.registrationDeadline ?? "") || null,
      body.isPublished === false ? 0 : 1,
      body.isArchived === true ? 1 : 0,
      auth.userId,
      now, now,
    ).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return json({ error: "ID/Slug déjà utilisé" }, corsHeaders, 409);
    return json({ error: "Erreur création formation" }, corsHeaders, 500);
  }

  const row = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  return json({ formation: row ? toFrontendFormation(row) : null }, corsHeaders, 201);
}

export async function handleUpdateFormation(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_formations");
  if ("error" in auth) return auth.error;
  await ensureFormationsTable(env);

  const existing = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  if (!existing) return json({ error: "Formation introuvable" }, corsHeaders, 404);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  // Liste blanche des champs PATCH-ables.
  // - jsonArrayFields : sérialisés en JSON pour les colonnes _json.
  // - boolean : convertis 0/1.
  // - number : Number().
  // - default string : sanitize().
  const fieldMap: Record<string, string> = {
    slug: "slug", title: "title", description: "description",
    content: "content", organizer: "organizer",
    startDate: "start_date", endDate: "end_date",
    location: "location", duration: "duration",
    capacity: "capacity", enrolled: "enrolled",
    targetAudience: "target_audience", prerequisites: "prerequisites",
    price: "price", contactEmail: "contact_email",
    status: "status", category: "category",
    modality: "modality",
    schedule: "schedule_json",
    attachments: "attachments_json",
    registrations: "registrations_json",
    registrationDeadline: "registration_deadline",
    isPublished: "is_published", isArchived: "is_archived",
  };
  const jsonArrayFields = new Set(["schedule_json", "attachments_json", "registrations_json"]);
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (!(key in body)) continue;
    let v = body[key];
    if (col === "is_published" || col === "is_archived") v = v ? 1 : 0;
    else if (col === "capacity" || col === "enrolled") v = Number(v ?? 0);
    else if (col === "content") v = sanitizeRichHtml(String(v ?? ""));
    else if (jsonArrayFields.has(col)) v = Array.isArray(v) ? JSON.stringify(v) : null;
    else if (typeof v === "string") v = sanitize(v);
    sets.push(`${col} = ?`);
    vals.push(v);
  }
  if (sets.length === 0) return json({ formation: toFrontendFormation(existing) }, corsHeaders);

  sets.push("updated_at = ?");
  vals.push(new Date().toISOString());
  vals.push(id);

  try {
    await env.DB.prepare(`UPDATE formations SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...vals).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return json({ error: "Slug déjà utilisé" }, corsHeaders, 409);
    return json({ error: "Erreur mise à jour" }, corsHeaders, 500);
  }

  const row = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  return json({ formation: row ? toFrontendFormation(row) : null }, corsHeaders);
}

export async function handleDeleteFormation(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_formations");
  if ("error" in auth) return auth.error;
  await ensureFormationsTable(env);

  // Snapshot before pour audit log
  const before = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  if (!before) return json({ error: "Formation introuvable" }, corsHeaders, 404);

  // Soft-delete (preserve traçabilité) : is_archived = 1, is_published = 0
  await env.DB.prepare(
    "UPDATE formations SET is_archived = 1, is_published = 0, updated_at = ? WHERE id = ?",
  ).bind(new Date().toISOString(), id).run();

  await logAudit(
    env, request,
    { id: auth.userId, role: "staff" },
    "formation.delete", "formation", id, before, null,
  );

  return json({ success: true, archived: true }, corsHeaders);
}

/**
 * POST /api/formations/:id/register — JWT simple (B1 fix session 54+++).
 * Permet à un adhérent/candidat de s'inscrire sans permission staff.
 */
export async function handleFormationRegister(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;
  await ensureFormationsTable(env);

  const row = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  if (!row) return json({ error: "Formation introuvable" }, corsHeaders, 404);
  if (row.is_archived === 1) return json({ error: "Formation archivée" }, corsHeaders, 400);

  // Deadline check (mirror du helper isRegistrationClosed front)
  if (row.registration_deadline) {
    const deadline = new Date(row.registration_deadline);
    if (!isNaN(deadline.getTime()) && new Date() > deadline) {
      return json({ error: "Date limite d'inscription dépassée" }, corsHeaders, 400);
    }
  }

  // Capacity check
  const current = safeJsonParse<string[]>(row.registrations_json, []);
  if (current.length >= row.capacity && !current.includes(payload.sub)) {
    return json({ error: "Formation complète" }, corsHeaders, 400);
  }

  const updated = Array.from(new Set([...current, payload.sub]));
  await env.DB.prepare(
    "UPDATE formations SET registrations_json = ?, updated_at = ? WHERE id = ?",
  ).bind(JSON.stringify(updated), new Date().toISOString(), id).run();

  const fresh = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  return json({ formation: fresh ? toFrontendFormation(fresh) : null }, corsHeaders);
}

export async function handleFormationUnregister(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;
  await ensureFormationsTable(env);

  const row = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  if (!row) return json({ error: "Formation introuvable" }, corsHeaders, 404);

  const current = safeJsonParse<string[]>(row.registrations_json, []);
  const updated = current.filter((uid) => uid !== payload.sub);
  await env.DB.prepare(
    "UPDATE formations SET registrations_json = ?, updated_at = ? WHERE id = ?",
  ).bind(JSON.stringify(updated), new Date().toISOString(), id).run();

  const fresh = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  return json({ formation: fresh ? toFrontendFormation(fresh) : null }, corsHeaders);
}
