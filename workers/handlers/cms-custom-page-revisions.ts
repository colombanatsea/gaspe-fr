/**
 * Handlers historique des pages CMS custom — migration 0045.
 *
 * Parallèle à `cms-revisions.ts` (pages système) mais schéma simplifié :
 * une page custom = 1 bloc HTML (vs array de sections pour les pages
 * système). Snapshot capturé avant chaque update + sur restore.
 *
 * Rétention 30 snapshots par page (auto-purge dans le helper de snapshot).
 *
 * Surface API :
 *   GET    /api/cms/custom-pages/:slug/revisions
 *   GET    /api/cms/custom-pages/:slug/revisions/:id
 *   POST   /api/cms/custom-pages/:slug/revisions/:id/restore
 *
 * Le `snapshotCustomPage` helper est exporté pour usage interne par
 * `cms-custom-pages.ts` (handleCmsUpdateCustomPage + DeleteCustomPage).
 */

import { json } from "../lib/json";
import { requireStaffPermission } from "../lib/auth";
import type { Env } from "../lib/env";

interface DbCustomPageRevision {
  id: number;
  custom_page_slug: string;
  snapshot_label: string;
  snapshot_description: string | null;
  snapshot_content: string | null;
  snapshot_published: number;
  created_by: string | null;
  label: string | null;
  created_at: string;
}

async function ensureRevisionsTable(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS cms_custom_page_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      custom_page_slug TEXT NOT NULL,
      snapshot_label TEXT NOT NULL,
      snapshot_description TEXT,
      snapshot_content TEXT,
      snapshot_published INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      label TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_custom_page_rev_slug ON cms_custom_page_revisions(custom_page_slug)",
    ).run();
  } catch {
    /* table déjà existante — ignore */
  }
}

/**
 * Crée un snapshot de la page custom passée en argument. Best-effort :
 * une erreur de snapshot ne fait pas échouer l'update appelant.
 *
 * Purge auto au-delà de 30 snapshots pour la page (rétention identique
 * à cms_revisions des pages système).
 *
 * Exporté pour usage par `cms-custom-pages.ts` qui le déclenche avant
 * chaque PUT ou DELETE pour permettre rollback.
 */
export async function snapshotCustomPage(
  env: Env,
  page: {
    slug: string;
    label: string;
    description: string | null;
    content: string;
    published: number;
  },
  createdBy: string | null,
  label: string | null,
): Promise<void> {
  try {
    await ensureRevisionsTable(env);
    await env.DB.prepare(
      `INSERT INTO cms_custom_page_revisions
        (custom_page_slug, snapshot_label, snapshot_description,
         snapshot_content, snapshot_published, created_by, label)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      page.slug,
      page.label,
      page.description,
      page.content,
      page.published ? 1 : 0,
      createdBy,
      label,
    ).run();

    // Purge : ne garde que les 30 plus récents.
    await env.DB.prepare(
      `DELETE FROM cms_custom_page_revisions
       WHERE custom_page_slug = ?
         AND id NOT IN (
           SELECT id FROM cms_custom_page_revisions
            WHERE custom_page_slug = ?
            ORDER BY created_at DESC
            LIMIT 30
         )`,
    ).bind(page.slug, page.slug).run();
  } catch (err) {
    console.error("[cms-custom-page-revisions] snapshot failed:", err);
    // Best-effort : ne propage pas pour ne pas casser l'update appelant.
  }
}

/**
 * GET /api/cms/custom-pages/:slug/revisions — liste les 30 dernières
 * révisions d'une page custom (ordre antéchrono).
 */
export async function handleCustomPageListRevisions(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  try {
    const { results } = await env.DB.prepare(
      `SELECT r.id, r.custom_page_slug, r.snapshot_label, r.snapshot_published,
              r.created_by, r.label, r.created_at,
              u.email AS created_by_email
         FROM cms_custom_page_revisions r
         LEFT JOIN users u ON u.id = r.created_by
        WHERE r.custom_page_slug = ?
        ORDER BY r.created_at DESC
        LIMIT 30`,
    ).bind(slug).all<DbCustomPageRevision & { created_by_email: string | null }>();

    return json(
      {
        revisions: (results ?? []).map((r) => ({
          id: r.id,
          slug: r.custom_page_slug,
          snapshotLabel: r.snapshot_label,
          snapshotPublished: r.snapshot_published === 1,
          createdBy: r.created_by,
          createdByEmail: r.created_by_email,
          label: r.label,
          createdAt: r.created_at,
        })),
      },
      corsHeaders,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ revisions: [] }, corsHeaders);
    }
    throw err;
  }
}

/**
 * GET /api/cms/custom-pages/:slug/revisions/:id — détail d'une révision
 * (snapshot complet pour preview avant restore).
 */
export async function handleCustomPageGetRevision(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
  revisionId: number,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  try {
    const row = await env.DB.prepare(
      `SELECT r.id, r.custom_page_slug, r.snapshot_label, r.snapshot_description,
              r.snapshot_content, r.snapshot_published, r.created_by, r.label,
              r.created_at, u.email AS created_by_email
         FROM cms_custom_page_revisions r
         LEFT JOIN users u ON u.id = r.created_by
        WHERE r.id = ? AND r.custom_page_slug = ?`,
    ).bind(revisionId, slug).first<DbCustomPageRevision & { created_by_email: string | null }>();

    if (!row) return json({ error: "Révision introuvable" }, corsHeaders, 404);

    return json(
      {
        revision: {
          id: row.id,
          slug: row.custom_page_slug,
          snapshotLabel: row.snapshot_label,
          snapshotDescription: row.snapshot_description ?? "",
          snapshotContent: row.snapshot_content ?? "",
          snapshotPublished: row.snapshot_published === 1,
          createdBy: row.created_by,
          createdByEmail: row.created_by_email,
          label: row.label,
          createdAt: row.created_at,
        },
      },
      corsHeaders,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ error: "Révision introuvable" }, corsHeaders, 404);
    }
    throw err;
  }
}

/**
 * POST /api/cms/custom-pages/:slug/revisions/:id/restore — restaure une
 * révision. Snapshot AVANT pour permettre le rollback du rollback.
 */
export async function handleCustomPageRestoreRevision(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
  revisionId: number,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const rev = await env.DB.prepare(
    `SELECT snapshot_label, snapshot_description, snapshot_content, snapshot_published
       FROM cms_custom_page_revisions WHERE id = ? AND custom_page_slug = ?`,
  ).bind(revisionId, slug).first<{
    snapshot_label: string;
    snapshot_description: string | null;
    snapshot_content: string | null;
    snapshot_published: number;
  }>();
  if (!rev) return json({ error: "Révision introuvable" }, corsHeaders, 404);

  // Snapshot l'état courant avant d'écraser (rollback du rollback).
  const current = await env.DB.prepare(
    `SELECT slug, label, description, content, published
       FROM cms_custom_pages WHERE slug = ? AND is_archived = 0`,
  ).bind(slug).first<{
    slug: string;
    label: string;
    description: string | null;
    content: string;
    published: number;
  }>();

  if (current) {
    await snapshotCustomPage(
      env,
      current,
      auth.userId,
      `Avant restauration de la révision #${revisionId}`,
    );
  }

  // Applique la révision.
  const res = await env.DB.prepare(
    `UPDATE cms_custom_pages
        SET label = ?, description = ?, content = ?, published = ?,
            updated_at = datetime('now')
      WHERE slug = ? AND is_archived = 0`,
  ).bind(
    rev.snapshot_label,
    rev.snapshot_description,
    rev.snapshot_content ?? "",
    rev.snapshot_published,
    slug,
  ).run();

  if (!res.success || (res.meta?.changes ?? 0) === 0) {
    return json({ error: "Page introuvable ou archivée" }, corsHeaders, 404);
  }

  return json({ success: true, restoredRevisionId: revisionId }, corsHeaders);
}
