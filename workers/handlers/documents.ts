/**
 * Handlers documents officiels (table cms_documents, migration 0010).
 *
 * Permission staff `manage_cms` requise pour POST/PATCH/DELETE.
 * Liste publique : seulement publiés + publics. Adhérents/admin avec `?all=1`
 * voient privés + brouillons.
 *
 * Extrait de `workers/api.ts` en J1 vague 5.e.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken, requireStaffPermission } from "../lib/auth";
import { sanitize } from "../lib/sanitize";
import type { Env } from "../lib/env";

interface DbDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  published_at: string | null;
  sort_order: number;
  is_public: number;
  published: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

function toFrontendDocument(row: DbDocument) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    fileUrl: row.file_url,
    fileName: row.file_name ?? "",
    publishedAt: row.published_at,
    sortOrder: row.sort_order ?? 0,
    isPublic: row.is_public === 1,
    published: row.published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function handleDocumentsList(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  params: URLSearchParams,
) {
  // `?all=1` : adherent/admin authentifié voit privés + brouillons
  const wantAll = params.get("all") === "1";
  const token = extractToken(request);
  let canSeeAll = false;
  if (wantAll && token) {
    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (payload) {
      canSeeAll = payload.role === "admin" || payload.role === "adherent";
    }
  }

  const query = canSeeAll
    ? "SELECT * FROM cms_documents ORDER BY category ASC, sort_order ASC, published_at DESC"
    : "SELECT * FROM cms_documents WHERE published = 1 AND is_public = 1 ORDER BY category ASC, sort_order ASC, published_at DESC";

  try {
    const { results } = await env.DB.prepare(query).all<DbDocument>();
    return json(
      { documents: (results ?? []).map(toFrontendDocument) },
      corsHeaders,
    );
  } catch (err) {
    // Table inexistante (migration pas encore appliquée) → réponse vide plutôt qu'une 500
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ documents: [] }, corsHeaders);
    }
    throw err;
  }
}

export async function handleDocumentGet(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  docId: string,
) {
  try {
    const row = await env.DB.prepare("SELECT * FROM cms_documents WHERE id = ?")
      .bind(docId)
      .first<DbDocument>();
    if (!row) return json({ error: "Document introuvable" }, corsHeaders, 404);

    // Si privé ou brouillon : exige JWT adherent/admin
    if (row.is_public !== 1 || row.published !== 1) {
      const token = extractToken(request);
      const payload = token ? await verifyJwt(token, env.JWT_SECRET) : null;
      if (!payload || (payload.role !== "admin" && payload.role !== "adherent")) {
        return json({ error: "Accès refusé" }, corsHeaders, 403);
      }
    }

    return json({ document: toFrontendDocument(row) }, corsHeaders);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ error: "Document introuvable" }, corsHeaders, 404);
    }
    throw err;
  }
}

export async function handleDocumentCreate(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const title = (body.title as string)?.trim();
  const category = (body.category as string) || "institutionnels";

  if (!title) return json({ error: "Titre requis" }, corsHeaders, 400);

  const id =
    (body.id as string) ||
    `doc-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40)}-${Date.now().toString(36)}`;

  const description = sanitize(((body.description as string) ?? "").trim());
  const fileUrl = ((body.fileUrl as string) ?? "#").trim() || "#";
  const fileName = sanitize(((body.fileName as string) ?? "").trim());
  const publishedAt = (body.publishedAt as string) ?? null;
  const sortOrder = Number.isFinite(body.sortOrder as number)
    ? (body.sortOrder as number)
    : 0;
  const isPublic = body.isPublic === false ? 0 : 1;
  const published = body.published === false ? 0 : 1;

  await env.DB.prepare(
    `INSERT INTO cms_documents
       (id, title, description, category, file_url, file_name, published_at,
        sort_order, is_public, published, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      sanitize(title),
      description,
      category,
      fileUrl,
      fileName,
      publishedAt,
      sortOrder,
      isPublic,
      published,
      auth.userId,
    )
    .run();

  const row = await env.DB.prepare("SELECT * FROM cms_documents WHERE id = ?")
    .bind(id)
    .first<DbDocument>();
  return json(
    { success: true, document: row ? toFrontendDocument(row) : null },
    corsHeaders,
    201,
  );
}

export async function handleDocumentUpdate(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  docId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const existing = await env.DB.prepare("SELECT id FROM cms_documents WHERE id = ?")
    .bind(docId)
    .first<{ id: string }>();
  if (!existing) return json({ error: "Document introuvable" }, corsHeaders, 404);

  const body = (await request.json()) as Record<string, unknown>;
  const fieldMap: Record<string, string> = {
    title: "title",
    description: "description",
    category: "category",
    fileUrl: "file_url",
    fileName: "file_name",
    publishedAt: "published_at",
    sortOrder: "sort_order",
    isPublic: "is_public",
    published: "published",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [fKey, dbCol] of Object.entries(fieldMap)) {
    if (fKey in body) {
      updates.push(`${dbCol} = ?`);
      const val = body[fKey];
      if (typeof val === "boolean") values.push(val ? 1 : 0);
      else if (typeof val === "string") values.push(sanitize(val));
      else values.push(val);
    }
  }

  if (updates.length === 0) {
    return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(docId);

  await env.DB.prepare(
    `UPDATE cms_documents SET ${updates.join(", ")} WHERE id = ?`,
  )
    .bind(...values)
    .run();

  const row = await env.DB.prepare("SELECT * FROM cms_documents WHERE id = ?")
    .bind(docId)
    .first<DbDocument>();
  return json(
    { success: true, document: row ? toFrontendDocument(row) : null },
    corsHeaders,
  );
  // Note : suppression du `auth` ici est volontaire — non utilisé après auth.
}

export async function handleDocumentDelete(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  docId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const existing = await env.DB.prepare("SELECT id FROM cms_documents WHERE id = ?")
    .bind(docId)
    .first<{ id: string }>();
  if (!existing) return json({ error: "Document introuvable" }, corsHeaders, 404);

  await env.DB.prepare("DELETE FROM cms_documents WHERE id = ?").bind(docId).run();
  return json({ success: true }, corsHeaders);
}
