/**
 * Handlers CMS custom pages — Phase 3 hybride (migration 0043).
 *
 * Extrait de `workers/api.ts` en session J1 pour amorcer le split du
 * Worker monolithique par domaine. Voir docs/WORKER-SPLIT-PLAN.md
 * pour la roadmap d'extraction complète.
 *
 * Surface API publique :
 *   GET    /api/cms/custom-pages         — liste (public published / admin ?all=1)
 *   GET    /api/cms/custom-pages/:slug   — détail (public, published only)
 *   POST   /api/cms/custom-pages         — création (admin only)
 *   PUT    /api/cms/custom-pages/:slug   — update (admin only, slug stable)
 *   DELETE /api/cms/custom-pages/:slug   — soft-delete (admin only)
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken, requireStaffPermission } from "../lib/auth";
import type { Env } from "../lib/env";

const CUSTOM_PAGE_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

interface DbCmsCustomPage {
  id: number;
  slug: string;
  label: string;
  description: string | null;
  content: string;
  published: number;
  is_archived: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function toFrontendCustomPage(row: DbCmsCustomPage) {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description ?? "",
    content: row.content ?? "",
    published: !!row.published,
    isArchived: !!row.is_archived,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/cms/custom-pages — liste les pages custom.
 *   - Sans auth → uniquement les pages publiées et non archivées.
 *   - Avec auth admin (?all=1) → toutes (incluant brouillons et archives).
 */
export async function handleCmsListCustomPages(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const url = new URL(request.url);
  const includeAll = url.searchParams.get("all") === "1";

  let canSeeAll = false;
  if (includeAll) {
    const token = extractToken(request);
    if (token) {
      const payload = await verifyJwt(token, env.JWT_SECRET);
      if (payload && (payload.role === "admin" || payload.role === "staff")) {
        canSeeAll = true;
      }
    }
  }

  try {
    const query = canSeeAll
      ? `SELECT * FROM cms_custom_pages ORDER BY updated_at DESC`
      : `SELECT * FROM cms_custom_pages WHERE published = 1 AND is_archived = 0 ORDER BY label`;
    const { results } = await env.DB.prepare(query).all<DbCmsCustomPage>();
    return json(
      { pages: (results ?? []).map(toFrontendCustomPage) },
      corsHeaders,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ pages: [] }, corsHeaders);
    }
    throw err;
  }
}

/**
 * GET /api/cms/custom-pages/:slug — détail (public, published seulement).
 */
export async function handleCmsGetCustomPage(
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
) {
  if (!CUSTOM_PAGE_SLUG_RE.test(slug)) {
    return json({ error: "Slug invalide" }, corsHeaders, 400);
  }
  try {
    const row = await env.DB.prepare(
      "SELECT * FROM cms_custom_pages WHERE slug = ? AND is_archived = 0 AND published = 1",
    ).bind(slug).first<DbCmsCustomPage>();
    if (!row) {
      return json({ error: "Page introuvable" }, corsHeaders, 404);
    }
    return json({ page: toFrontendCustomPage(row) }, corsHeaders);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ error: "Page introuvable" }, corsHeaders, 404);
    }
    throw err;
  }
}

/**
 * POST /api/cms/custom-pages — créer une page custom. Admin only.
 */
export async function handleCmsCreateCustomPage(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  let body: {
    slug?: string;
    label?: string;
    description?: string;
    content?: string;
    published?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "JSON invalide" }, corsHeaders, 400);
  }

  const slug = (body.slug ?? "").trim();
  const label = (body.label ?? "").trim();
  if (!CUSTOM_PAGE_SLUG_RE.test(slug)) {
    return json({ error: "Slug invalide (a-z, 0-9, tiret ; max 80 caractères)" }, corsHeaders, 400);
  }
  if (!label) {
    return json({ error: "Le label est requis" }, corsHeaders, 400);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO cms_custom_pages (slug, label, description, content, published, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
      slug,
      label,
      body.description ?? null,
      body.content ?? "",
      body.published ? 1 : 0,
      auth.userId,
    ).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/UNIQUE constraint/i.test(msg)) {
      return json({ error: `Une page avec le slug "${slug}" existe déjà` }, corsHeaders, 409);
    }
    throw err;
  }

  return json({ success: true, slug }, corsHeaders);
}

/**
 * PUT /api/cms/custom-pages/:slug — update. Admin only. Slug stable.
 */
export async function handleCmsUpdateCustomPage(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  if (!CUSTOM_PAGE_SLUG_RE.test(slug)) {
    return json({ error: "Slug invalide" }, corsHeaders, 400);
  }

  let body: {
    label?: string;
    description?: string;
    content?: string;
    published?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "JSON invalide" }, corsHeaders, 400);
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  if (typeof body.label === "string" && body.label.trim()) {
    updates.push("label = ?");
    values.push(body.label.trim());
  }
  if (typeof body.description === "string") {
    updates.push("description = ?");
    values.push(body.description);
  }
  if (typeof body.content === "string") {
    updates.push("content = ?");
    values.push(body.content);
  }
  if (typeof body.published === "boolean") {
    updates.push("published = ?");
    values.push(body.published ? 1 : 0);
  }

  if (updates.length === 0) {
    return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(slug);

  void auth; // audit log possible ici plus tard

  const res = await env.DB.prepare(
    `UPDATE cms_custom_pages SET ${updates.join(", ")} WHERE slug = ? AND is_archived = 0`,
  ).bind(...values).run();

  if (!res.success || (res.meta?.changes ?? 0) === 0) {
    return json({ error: "Page introuvable" }, corsHeaders, 404);
  }

  return json({ success: true }, corsHeaders);
}

/**
 * DELETE /api/cms/custom-pages/:slug — soft-delete. Admin only.
 */
export async function handleCmsDeleteCustomPage(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;
  void auth;

  const res = await env.DB.prepare(
    "UPDATE cms_custom_pages SET is_archived = 1, published = 0, updated_at = datetime('now') WHERE slug = ?",
  ).bind(slug).run();

  if (!res.success || (res.meta?.changes ?? 0) === 0) {
    return json({ error: "Page introuvable" }, corsHeaders, 404);
  }

  return json({ success: true }, corsHeaders);
}
