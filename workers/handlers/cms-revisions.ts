/**
 * Handlers CMS revisions — migration 0011.
 *
 * Rétention 30 snapshots par page. Le restore écrase l'état courant
 * mais crée AUSSI un nouveau snapshot au préalable (versionning complet,
 * permet de "rollback du rollback").
 *
 * Extrait de `workers/api.ts` en J1 vague 1.a (session 61).
 */

import { json } from "../lib/json";
import { requireStaffPermission } from "../lib/auth";
import type { Env } from "../lib/env";

interface DbCmsRevision {
  id: number;
  page_id: string;
  snapshot_json: string;
  created_by: string | null;
  label: string | null;
  created_at: string;
}

/**
 * GET /api/cms/pages/:pageId/revisions — liste les 30 dernières
 * révisions d'une page (ordre antéchrono). LEFT JOIN sur users pour
 * ramener l'email de l'auteur (tolère NULL si user supprimé). JWT+admin.
 */
export async function handleCmsListRevisions(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  try {
    const { results } = await env.DB.prepare(
      `SELECT r.id, r.page_id, r.snapshot_json, r.created_by, r.label, r.created_at,
              u.email AS created_by_email
         FROM cms_revisions r
         LEFT JOIN users u ON u.id = r.created_by
        WHERE r.page_id = ?
        ORDER BY r.created_at DESC
        LIMIT 30`,
    ).bind(pageId).all<DbCmsRevision & { created_by_email: string | null }>();

    return json(
      {
        revisions: (results ?? []).map((r) => ({
          id: r.id,
          pageId: r.page_id,
          createdBy: r.created_by,
          createdByEmail: r.created_by_email,
          label: r.label,
          createdAt: r.created_at,
          sectionsCount: (() => {
            try {
              return (JSON.parse(r.snapshot_json) as unknown[]).length;
            } catch {
              return 0;
            }
          })(),
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
 * GET /api/cms/pages/:pageId/revisions/:id — détail d'une révision
 * (snapshot complet désérialisé pour la vue diff). JWT+admin.
 */
export async function handleCmsGetRevision(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
  revisionId: number,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  try {
    const row = await env.DB.prepare(
      `SELECT r.id, r.page_id, r.snapshot_json, r.created_by, r.label, r.created_at,
              u.email AS created_by_email
         FROM cms_revisions r
         LEFT JOIN users u ON u.id = r.created_by
        WHERE r.id = ? AND r.page_id = ?`,
    ).bind(revisionId, pageId).first<DbCmsRevision & { created_by_email: string | null }>();

    if (!row) return json({ error: "Révision introuvable" }, corsHeaders, 404);

    let sections: Array<{ section_id: string; label: string; type: string; content: string }> = [];
    try {
      const parsed = JSON.parse(row.snapshot_json);
      if (Array.isArray(parsed)) sections = parsed;
    } catch {
      return json({ error: "Snapshot corrompu" }, corsHeaders, 500);
    }

    return json(
      {
        revision: {
          id: row.id,
          pageId: row.page_id,
          createdBy: row.created_by,
          createdByEmail: row.created_by_email,
          label: row.label,
          createdAt: row.created_at,
          sections: sections.map((s) => ({
            id: s.section_id,
            label: s.label,
            type: s.type,
            content: s.content,
          })),
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
 * POST /api/cms/pages/:pageId/revisions/:id/restore — restaure une
 * révision. Snapshot AVANT du contenu courant pour permettre le
 * rollback du rollback. JWT+admin.
 */
export async function handleCmsRestoreRevision(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
  revisionId: number,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const row = await env.DB.prepare(
    "SELECT snapshot_json FROM cms_revisions WHERE id = ? AND page_id = ?",
  ).bind(revisionId, pageId).first<{ snapshot_json: string }>();
  if (!row) return json({ error: "Révision introuvable" }, corsHeaders, 404);

  let sections: { section_id: string; label: string; type: string; content: string }[];
  try {
    sections = JSON.parse(row.snapshot_json);
    if (!Array.isArray(sections)) throw new Error("snapshot invalide");
  } catch {
    return json({ error: "Snapshot corrompu" }, corsHeaders, 500);
  }

  // Avant d'écraser, snapshot l'état courant (rollback du rollback).
  try {
    const { results: existing } = await env.DB.prepare(
      "SELECT section_id, label, type, content FROM cms_pages WHERE page_id = ?",
    ).bind(pageId).all<{ section_id: string; label: string; type: string; content: string }>();

    if (existing && existing.length > 0) {
      await env.DB.prepare(`
        INSERT INTO cms_revisions (page_id, snapshot_json, created_by, label)
        VALUES (?, ?, ?, ?)
      `).bind(
        pageId,
        JSON.stringify(existing),
        auth.userId,
        `Avant restauration de la révision #${revisionId}`,
      ).run();
    }
  } catch {
    /* best-effort */
  }

  const now = new Date().toISOString();
  await env.DB.prepare("DELETE FROM cms_pages WHERE page_id = ?").bind(pageId).run();
  for (const s of sections) {
    await env.DB.prepare(`
      INSERT INTO cms_pages (page_id, section_id, label, type, content, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(pageId, s.section_id, s.label, s.type, s.content, now).run();
  }

  return json({ success: true, restoredRevisionId: revisionId }, corsHeaders);
}
