/**
 * Handler upload générique (POST /api/upload) → R2.
 *
 * JWT auth requis (tout user authentifié). Magic bytes + size + MIME
 * validés via ./lib/uploads. Stocké sous `<type>/<uuid>-<filename>`.
 *
 * Extrait de `workers/api.ts` en J1 vague 7.b.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken } from "../lib/auth";
import { deriveMimeType, validateMagicBytes } from "../lib/uploads";
import type { Env } from "../lib/env";

export async function handleUpload(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  // Require authentication
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string; // "cv" | "document"

  if (!file) {
    return json({ error: "Aucun fichier fourni" }, corsHeaders, 400);
  }

  // Validate MIME type (fallback extension si file.type vide ou octet-stream)
  const effectiveType = deriveMimeType(file);
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowed.includes(effectiveType)) {
    return json({ error: "Type de fichier non autorisé (PDF, DOC, DOCX uniquement)" }, corsHeaders, 400);
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return json({ error: "Fichier trop volumineux (max 10 Mo)" }, corsHeaders, 400);
  }

  // Magic bytes validation – read first 4 bytes to verify actual file type
  const buffer = await file.arrayBuffer();
  if (!validateMagicBytes(buffer, effectiveType)) {
    return json(
      { error: "Le contenu du fichier ne correspond pas au type déclaré. Fichier refusé." },
      corsHeaders,
      400,
    );
  }

  const key = `${type || "document"}/${crypto.randomUUID()}-${file.name}`;
  await env.UPLOADS.put(key, buffer, {
    httpMetadata: { contentType: effectiveType },
    customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
  });

  return json({ success: true, key, filename: file.name }, corsHeaders);
}
