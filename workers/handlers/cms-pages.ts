/**
 * Handlers CMS pages système — édition via /admin/pages.
 *
 * Le contenu est stocké dans la table `cms_pages` (clé composite
 * `page_id + section_id`). Chaque `handleCmsUpsertPage` snapshotte
 * l'état courant dans `cms_revisions` (migration 0011) avant
 * écrasement, avec rétention des 30 dernières révisions par page.
 *
 * Extrait de `workers/api.ts` en J1 vague 1.b.
 */

import { json } from "../lib/json";
import { requireStaffPermission } from "../lib/auth";
import type { Env } from "../lib/env";

interface DbCmsPageRow {
  page_id: string;
  section_id: string;
  label: string;
  type: string;
  content: string;
  updated_at: string;
}

/**
 * GET /api/cms/pages — liste toutes les pages CMS, regroupées par
 * `page_id` avec leurs sections. Pas d'auth requise (rendu public).
 */
export async function handleCmsListPages(env: Env, corsHeaders: Record<string, string>) {
  let results: DbCmsPageRow[] | undefined;
  try {
    ({ results } = await env.DB.prepare(
      "SELECT * FROM cms_pages ORDER BY page_id, section_id",
    ).all<DbCmsPageRow>());
  } catch {
    return json({ pages: {} }, corsHeaders);
  }

  const pages: Record<
    string,
    {
      pageId: string;
      sections: { id: string; label: string; type: string; content: string }[];
      updatedAt: string;
    }
  > = {};
  for (const row of results ?? []) {
    if (!pages[row.page_id]) {
      pages[row.page_id] = { pageId: row.page_id, sections: [], updatedAt: row.updated_at };
    }
    pages[row.page_id].sections.push({
      id: row.section_id,
      label: row.label,
      type: row.type,
      content: row.content,
    });
    if (row.updated_at > pages[row.page_id].updatedAt) {
      pages[row.page_id].updatedAt = row.updated_at;
    }
  }

  return json({ pages }, corsHeaders);
}

/**
 * GET /api/cms/pages/:pageId — détail d'une page (toutes sections triées
 * par `section_id`). Pas d'auth requise.
 */
export async function handleCmsGetPage(
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
) {
  let results: DbCmsPageRow[] | undefined;
  try {
    ({ results } = await env.DB.prepare(
      "SELECT * FROM cms_pages WHERE page_id = ? ORDER BY section_id",
    ).bind(pageId).all<DbCmsPageRow>());
  } catch {
    return json({ page: null }, corsHeaders);
  }

  if (!results || results.length === 0) {
    return json({ page: null }, corsHeaders);
  }

  const page = {
    pageId,
    sections: results.map((r) => ({
      id: r.section_id,
      label: r.label,
      type: r.type,
      content: r.content,
    })),
    updatedAt: results.reduce(
      (max, r) => (r.updated_at > max ? r.updated_at : max),
      results[0].updated_at,
    ),
  };

  return json({ page }, corsHeaders);
}

/**
 * PUT /api/cms/pages/:pageId — upsert atomique de toutes les sections
 * d'une page. Snapshotte l'état courant dans `cms_revisions` (migration
 * 0011) avant écrasement et purge au-delà de 30 révisions. Permission
 * staff `manage_cms`.
 */
export async function handleCmsUpsertPage(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    sections: { id: string; label: string; type: string; content: string }[];
    label?: string;
  };

  if (!body.sections?.length) {
    return json({ error: "Au moins une section requise" }, corsHeaders, 400);
  }

  const now = new Date().toISOString();

  // Auto-create tables if migrations not yet applied
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS cms_pages (
      page_id TEXT NOT NULL, section_id TEXT NOT NULL, label TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'text', content TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (page_id, section_id)
    )`).run();
  } catch { /* already exists */ }

  // Snapshot de l'état ACTUEL avant écrasement (migration 0011).
  // Silencieux si la table cms_revisions n'existe pas encore.
  try {
    const { results: existing } = await env.DB.prepare(
      "SELECT section_id, label, type, content FROM cms_pages WHERE page_id = ?",
    ).bind(pageId).all<{ section_id: string; label: string; type: string; content: string }>();

    if (existing && existing.length > 0) {
      const snapshot = JSON.stringify(existing);
      await env.DB.prepare(`
        INSERT INTO cms_revisions (page_id, snapshot_json, created_by, label)
        VALUES (?, ?, ?, ?)
      `).bind(pageId, snapshot, auth.userId, body.label ?? null).run();

      // Rétention : on garde les 30 révisions les plus récentes par page.
      // Les plus anciennes au-delà sont purgées pour éviter une explosion du volume.
      await env.DB.prepare(`
        DELETE FROM cms_revisions
        WHERE page_id = ?
          AND id NOT IN (
            SELECT id FROM cms_revisions
            WHERE page_id = ?
            ORDER BY created_at DESC
            LIMIT 30
          )
      `).bind(pageId, pageId).run();
    }
  } catch {
    /* migration 0011 pas encore appliquée – versioning silencieusement désactivé */
  }

  for (const section of body.sections) {
    await env.DB.prepare(`
      INSERT INTO cms_pages (page_id, section_id, label, type, content, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(page_id, section_id) DO UPDATE SET
        label = excluded.label,
        type = excluded.type,
        content = excluded.content,
        updated_at = excluded.updated_at
    `).bind(pageId, section.id, section.label, section.type, section.content, now).run();
  }

  return json({ success: true }, corsHeaders);
}
