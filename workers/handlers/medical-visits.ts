/**
 * Handlers visites médicales marins (aptitude ENIM / DAM).
 *
 * Scope user : un user ne voit que ses propres visites. Soft-delete
 * (P2-2, migration 0036) car aptitude médicale = donnée légale
 * sensible, à conserver pour audits ENIM / DAM.
 *
 * Extrait de `workers/api.ts` en J1 vague 5.b.
 */

import { json } from "../lib/json";
import { requireJwt } from "../lib/auth";
import { sanitize } from "../lib/sanitize";
import { logAudit } from "../lib/audit";
import type { Env } from "../lib/env";

interface DbMedicalVisit {
  id: string; user_id: string; sailor_name: string; sailor_role: string | null;
  type: string; date: string; expiry_date: string | null;
  center_id: string | null; doctor_id: string | null; doctor_name: string | null;
  certificate_ref: string | null; notes: string | null; status: string;
  created_at: string; updated_at: string;
}

function toFrontendVisit(row: DbMedicalVisit) {
  return {
    id: row.id,
    sailorName: row.sailor_name,
    sailorRole: row.sailor_role ?? undefined,
    type: row.type,
    date: row.date,
    expiryDate: row.expiry_date ?? undefined,
    centerId: row.center_id ?? undefined,
    doctorId: row.doctor_id ?? undefined,
    doctorName: row.doctor_name ?? undefined,
    certificateRef: row.certificate_ref ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
  };
}

export async function handleMedicalList(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const { results } = await env.DB.prepare(
    "SELECT * FROM medical_visits WHERE user_id = ? ORDER BY date DESC",
  ).bind(payload.sub).all<DbMedicalVisit>();

  return json({ visits: (results ?? []).map(toFrontendVisit) }, corsHeaders);
}

export async function handleMedicalCreate(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const body = (await request.json()) as Record<string, unknown>;
  const sailorName = body.sailorName as string;
  const visitDate = body.date as string;
  const visitType = body.type as string;

  if (!sailorName?.trim() || !visitDate || !visitType) {
    return json({ error: "Nom du marin, date et type requis" }, corsHeaders, 400);
  }

  const id = (body.id as string) || crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO medical_visits (id, user_id, sailor_name, sailor_role, type, date, expiry_date,
      center_id, doctor_id, doctor_name, certificate_ref, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, payload.sub, sanitize(sailorName.trim()),
    (body.sailorRole as string)?.trim() || null,
    visitType, visitDate,
    (body.expiryDate as string) || null,
    (body.centerId as string) || null,
    (body.doctorId as string) || null,
    (body.doctorName as string) || null,
    (body.certificateRef as string) || null,
    (body.notes as string) || null,
    (body.status as string) || "scheduled",
  ).run();

  const row = await env.DB.prepare("SELECT * FROM medical_visits WHERE id = ?").bind(id).first<DbMedicalVisit>();
  return json({ success: true, visit: row ? toFrontendVisit(row) : null }, corsHeaders, 201);
}

export async function handleMedicalUpdate(request: Request, env: Env, corsHeaders: Record<string, string>, visitId: string) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const existing = await env.DB.prepare("SELECT user_id FROM medical_visits WHERE id = ?").bind(visitId).first<{ user_id: string }>();
  if (!existing) return json({ error: "Visite introuvable" }, corsHeaders, 404);
  if (existing.user_id !== payload.sub && payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const fieldMap: Record<string, string> = {
    sailorName: "sailor_name", sailorRole: "sailor_role", type: "type",
    date: "date", expiryDate: "expiry_date", centerId: "center_id",
    doctorId: "doctor_id", doctorName: "doctor_name",
    certificateRef: "certificate_ref", notes: "notes", status: "status",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [fKey, dbCol] of Object.entries(fieldMap)) {
    if (fKey in body) {
      updates.push(`${dbCol} = ?`);
      values.push(body[fKey]);
    }
  }

  if (updates.length === 0) return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  updates.push("updated_at = datetime('now')");
  values.push(visitId);

  await env.DB.prepare(`UPDATE medical_visits SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  const row = await env.DB.prepare("SELECT * FROM medical_visits WHERE id = ?").bind(visitId).first<DbMedicalVisit>();
  return json({ success: true, visit: row ? toFrontendVisit(row) : null }, corsHeaders);
}

export async function handleMedicalDelete(request: Request, env: Env, corsHeaders: Record<string, string>, visitId: string) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const before = await env.DB.prepare("SELECT * FROM medical_visits WHERE id = ?").bind(visitId).first<DbMedicalVisit>();
  if (!before) return json({ error: "Visite introuvable" }, corsHeaders, 404);
  if (before.user_id !== payload.sub && payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  // Soft-delete (P2-2, migration 0036) : aptitude médicale = donnée légale
  // sensible, conserver l'historique pour audits ENIM / DAM.
  try {
    await env.DB.prepare(
      "UPDATE medical_visits SET is_archived = 1, updated_at = datetime('now') WHERE id = ?",
    ).bind(visitId).run();
  } catch {
    await env.DB.prepare("DELETE FROM medical_visits WHERE id = ?").bind(visitId).run();
  }

  await logAudit(
    env, request,
    { id: payload.sub, email: payload.email ?? null, role: payload.role },
    "medical_visit.delete", "medical_visit", visitId, before, null,
  );

  return json({ success: true, archived: true }, corsHeaders);
}
