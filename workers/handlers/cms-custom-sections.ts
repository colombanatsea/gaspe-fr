/**
 * Handlers CMS custom sections — Phase 1 et 2 hybride (migration 0042).
 *
 * Permet à l'admin d'ajouter une section éditable sur une page système
 * sans toucher au code, et de réordonner ces sections. Voir
 * `docs/CMS-HYBRID-PLAN.md`.
 *
 * Extrait de `workers/api.ts` en J1 vague 1.c.
 */

import { json } from "../lib/json";
import { requireStaffPermission } from "../lib/auth";
import type { Env } from "../lib/env";

const CMS_SECTION_TYPES = new Set(["text", "richtext", "image", "config", "list"]);
const SECTION_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

interface DbCmsCustomSection {
  id: number;
  page_id: string;
  section_id: string;
  label: string;
  type: string;
  item_fields_json: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
}

function toFrontendCustomSection(row: DbCmsCustomSection) {
  let itemFields: unknown = undefined;
  if (row.item_fields_json) {
    try {
      itemFields = JSON.parse(row.item_fields_json);
    } catch {
      itemFields = undefined;
    }
  }
  return {
    id: row.id,
    pageId: row.page_id,
    sectionId: row.section_id,
    label: row.label,
    type: row.type,
    itemFields,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/cms/custom-sections — liste publique de toutes les custom
 * sections. Pas d'auth requise : le frontend fusionne avec PAGE_DEFINITIONS
 * au runtime pour afficher les contenus côté public.
 */
export async function handleCmsListAllCustomSections(
  env: Env,
  corsHeaders: Record<string, string>,
) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, page_id, section_id, label, type, item_fields_json, sort_order, created_by, created_at
         FROM cms_custom_sections
        ORDER BY page_id, sort_order, id`,
    ).all<DbCmsCustomSection>();
    return json({ sections: (results ?? []).map(toFrontendCustomSection) }, corsHeaders);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ sections: [] }, corsHeaders);
    }
    throw err;
  }
}

/**
 * POST /api/cms/pages/:pageId/custom-sections — créer une section custom.
 * Body : { sectionId, label, type, itemFields? }. Admin only.
 */
export async function handleCmsCreateCustomSection(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  let body: { sectionId?: string; label?: string; type?: string; itemFields?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "JSON invalide" }, corsHeaders, 400);
  }

  const sectionId = (body.sectionId ?? "").trim();
  const label = (body.label ?? "").trim();
  const type = (body.type ?? "").trim();

  if (!SECTION_ID_RE.test(sectionId)) {
    return json({ error: "sectionId invalide (a-z, 0-9, tiret ; max 64 caractères)" }, corsHeaders, 400);
  }
  if (!label) {
    return json({ error: "Le label est requis" }, corsHeaders, 400);
  }
  if (!CMS_SECTION_TYPES.has(type)) {
    return json({ error: "Type invalide (text, richtext, image, config, list)" }, corsHeaders, 400);
  }

  const itemFieldsJson = body.itemFields ? JSON.stringify(body.itemFields) : null;

  // sort_order = max + 1 pour les sections existantes sur la page
  const maxRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(sort_order), 0) AS m FROM cms_custom_sections WHERE page_id = ?",
  ).bind(pageId).first<{ m: number }>();
  const nextOrder = (maxRow?.m ?? 0) + 1;

  try {
    await env.DB.prepare(
      `INSERT INTO cms_custom_sections (page_id, section_id, label, type, item_fields_json, sort_order, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(pageId, sectionId, label, type, itemFieldsJson, nextOrder, auth.userId).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/UNIQUE constraint/i.test(msg)) {
      return json({ error: `Une section "${sectionId}" existe déjà sur cette page` }, corsHeaders, 409);
    }
    throw err;
  }

  return json({ success: true }, corsHeaders);
}

/**
 * DELETE /api/cms/pages/:pageId/custom-sections/:sectionId — supprimer
 * une custom section. Admin only. Supprime aussi le contenu associé
 * dans cms_pages pour éviter les orphelins.
 */
export async function handleCmsDeleteCustomSection(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
  sectionId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const res = await env.DB.prepare(
    "DELETE FROM cms_custom_sections WHERE page_id = ? AND section_id = ?",
  ).bind(pageId, sectionId).run();

  if (!res.success || (res.meta?.changes ?? 0) === 0) {
    return json({ error: "Section custom introuvable" }, corsHeaders, 404);
  }

  // Best-effort : on retire aussi le contenu éditorial pour éviter de
  // garder des orphelins dans cms_pages.
  try {
    await env.DB.prepare(
      "DELETE FROM cms_pages WHERE page_id = ? AND section_id = ?",
    ).bind(pageId, sectionId).run();
  } catch { /* silencieux */ }

  void auth;

  return json({ success: true }, corsHeaders);
}

/**
 * PATCH /api/cms/pages/:pageId/custom-sections/reorder — réordonner les
 * sections custom d'une page (Phase 2 hybride). Admin only.
 *
 * Body : { orderedSectionIds: string[] } — liste exhaustive des
 * section_id custom de la page, dans le nouvel ordre voulu. Les
 * `sort_order` sont réécrits en index 1..N. Les section_id absents de
 * la liste sont ignorés (rétention de leur sort_order initial).
 */
export async function handleCmsReorderCustomSections(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  let body: { orderedSectionIds?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "JSON invalide" }, corsHeaders, 400);
  }

  if (!Array.isArray(body.orderedSectionIds)) {
    return json({ error: "Champ `orderedSectionIds` (string[]) requis" }, corsHeaders, 400);
  }

  // Validation : chaque entrée doit être un sectionId valide.
  const ids: string[] = [];
  for (const v of body.orderedSectionIds) {
    if (typeof v !== "string" || !SECTION_ID_RE.test(v)) {
      return json({ error: "Chaque entrée doit être un sectionId valide" }, corsHeaders, 400);
    }
    ids.push(v);
  }

  // Pas de doublons.
  if (new Set(ids).size !== ids.length) {
    return json({ error: "Doublons interdits dans orderedSectionIds" }, corsHeaders, 400);
  }

  // Application séquentielle : UPDATE chaque section custom (page_id,
  // section_id) avec son nouvel index. Les sections introuvables sont
  // tolérées (no-op).
  for (let i = 0; i < ids.length; i++) {
    await env.DB.prepare(
      "UPDATE cms_custom_sections SET sort_order = ? WHERE page_id = ? AND section_id = ?",
    ).bind(i + 1, pageId, ids[i]).run();
  }

  void auth;

  return json({ success: true, count: ids.length }, corsHeaders);
}
