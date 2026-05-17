/**
 * Handlers media library (table media_files, R2 bucket UPLOADS).
 *
 * Permission staff `manage_cms` requise pour list/upload/delete.
 * Serving public via `/api/media/raw/:r2Key` (clés sous "media/" uniquement).
 *
 * Extrait de `workers/api.ts` en J1 vague 5.f.
 */

import { json } from "../lib/json";
import { requireStaffPermission } from "../lib/auth";
import { deriveMimeType, validateMediaMagicBytes } from "../lib/uploads";
import type { Env } from "../lib/env";

export async function handleMediaList(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const { results } = await env.DB.prepare(
    "SELECT * FROM media_files ORDER BY created_at DESC",
  ).all<{ id: string; name: string; type: string; r2_key: string; size: number; alt: string | null; uploaded_by: string | null; created_at: string }>();

  return json({
    items: (results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      r2Key: r.r2_key,
      size: r.size,
      alt: r.alt ?? undefined,
      uploadedBy: r.uploaded_by ?? undefined,
      uploadedAt: r.created_at,
    })),
  }, corsHeaders);
}

export async function handleMediaUpload(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const alt = formData.get("alt") as string;

  if (!file) return json({ error: "Aucun fichier fourni" }, corsHeaders, 400);

  // Type effectif (fallback sur extension si file.type vide / octet-stream — Windows DOCX)
  const effectiveType = deriveMimeType(file);

  const allowedTypes = [
    "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(effectiveType)) {
    return json({ error: "Type de fichier non autorisé" }, corsHeaders, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return json({ error: "Fichier trop volumineux (max 10 Mo)" }, corsHeaders, 400);
  }

  const buffer = await file.arrayBuffer();
  if (!validateMediaMagicBytes(buffer, effectiveType)) {
    return json({ error: "Le contenu du fichier ne correspond pas au type déclaré" }, corsHeaders, 400);
  }

  const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const r2Key = `media/${crypto.randomUUID()}-${file.name}`;

  await env.UPLOADS.put(r2Key, buffer, {
    httpMetadata: { contentType: effectiveType },
    customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
  });

  await env.DB.prepare(`
    INSERT INTO media_files (id, name, type, r2_key, size, alt, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, file.name, effectiveType, r2Key, file.size, alt || null, auth.userId).run();

  return json({
    success: true,
    item: { id, name: file.name, type: effectiveType, r2Key, size: file.size, alt: alt || undefined, uploadedAt: new Date().toISOString() },
  }, corsHeaders, 201);
}

export async function handleMediaDelete(
  request: Request, env: Env, corsHeaders: Record<string, string>, mediaId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const row = await env.DB.prepare("SELECT r2_key FROM media_files WHERE id = ?").bind(mediaId).first<{ r2_key: string }>();
  if (!row) return json({ error: "Fichier introuvable" }, corsHeaders, 404);

  // Delete from R2
  await env.UPLOADS.delete(row.r2_key);
  // Delete metadata
  await env.DB.prepare("DELETE FROM media_files WHERE id = ?").bind(mediaId).run();

  return json({ success: true }, corsHeaders);
}

/**
 * Public raw media serving – GET /api/media/raw/:r2Key
 * Pas d'auth : les images uploadées via CMS sont destinées à être affichées
 * publiquement (photos bureau, illustrations de pages, etc.).
 * Clé R2 nettoyée pour n'accepter que les préfixes connus.
 */
export async function handleMediaRaw(
  env: Env, corsHeaders: Record<string, string>, r2Key: string,
) {
  // Seules les clés sous "media/" sont exposées publiquement (le reste R2 est privé).
  if (!r2Key.startsWith("media/") || r2Key.includes("..")) {
    return new Response("Ressource introuvable", { status: 404, headers: corsHeaders });
  }
  const object = await env.UPLOADS.get(r2Key);
  if (!object) return new Response("Ressource introuvable", { status: 404, headers: corsHeaders });

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400, immutable");
  return new Response(object.body, { headers });
}
