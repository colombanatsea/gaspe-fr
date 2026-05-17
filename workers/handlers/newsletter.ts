/**
 * Handlers newsletter (categories, preferences, contact, subscription,
 * send, drafts v2, brevo webhook, unsubscribe).
 *
 * Permission staff manage_newsletter requise pour les endpoints admin
 * (create/update/archive categories, sync brevo, drafts CRUD, test/bulk
 * send). Helpers Brevo (sendBrevoTransactional, logBrevoSent,
 * alreadyBrevoSent, brevoCreateList, brevoUpdateList) consommés via
 * ./lib/brevo. Idempotence cross-canal via table email_sent_log +
 * nl_events.
 *
 * Extrait de  en J1 vague 4.b. Dernière vague du chantier
 * J1 (objectif api.ts < 800 lignes).
 *
 * Le local helper  reste privé au module (pour
 * compatibilité endpoints admin newsletter v1 antérieurs au RBAC staff
 * granulaire). Les endpoints v2 utilisent la canonique
 *  importée de ./lib/auth.
 */

import { signJwt, verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken, requireStaffPermission, requireJwt } from "../lib/auth";
import { sanitize } from "../lib/sanitize";
import { sendBrevoTransactional, logBrevoSent, alreadyBrevoSent } from "../lib/brevo";
import { SITE_URL } from "../lib/constants";
import type { Env } from "../lib/env";

// ═══════════════════════════════════════════════════════════
//  Newsletter Categories (table dynamique migration 0040)
// ═══════════════════════════════════════════════════════════

interface DbNewsletterCategory {
  key: string;
  label: string;
  description: string | null;
  brevo_list_id: number | null;
  audience_filter: string;
  is_public: number;
  is_system: number;
  sort_order: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

function toFrontendCategory(row: DbNewsletterCategory) {
  return {
    key: row.key,
    label: row.label,
    description: row.description ?? undefined,
    brevoListId: row.brevo_list_id ?? undefined,
    audienceFilter: row.audience_filter,
    isPublic: row.is_public === 1,
    isSystem: row.is_system === 1,
    sortOrder: row.sort_order,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Vérifie qu'un user est éligible à une catégorie selon l'audience_filter.
 * Charge l'organisation si nécessaire (cache implicite : un seul SELECT par appel).
 */
async function userEligibleForCategory(
  env: Env,
  userId: string,
  audienceFilter: string,
): Promise<boolean> {
  if (audienceFilter === "all") return true;

  const u = await env.DB.prepare(
    `SELECT u.role, u.approved, u.organization_id, o.college, o.social3228
     FROM users u
     LEFT JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = ?`,
  ).bind(userId).first<{
    role: string; approved: number; organization_id: string | null;
    college: string | null; social3228: number | null;
  }>();
  if (!u) return false;

  switch (audienceFilter) {
    case "adherent_only":
      return u.role === "adherent" && u.approved === 1;
    case "social_3228":
      return u.role === "adherent" && u.approved === 1 && u.social3228 === 1;
    case "college_a":
      return u.role === "adherent" && u.approved === 1 && u.college === "A";
    case "college_b":
      return u.role === "adherent" && u.approved === 1 && u.college === "B";
    case "college_c":
      return u.role === "adherent" && u.approved === 1 && u.college === "C";
    default:
      // Filtre inconnu → fail closed
      return false;
  }
}

/**
 * GET /api/newsletter/categories — liste publique (auth requise) filtrée
 * selon les catégories visibles à l'utilisateur. Ne renvoie pas les
 * catégories archived ni is_public=0.
 */
export async function handleListNewsletterCategoriesPublic(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  let rows: DbNewsletterCategory[] = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM newsletter_categories
       WHERE archived = 0 AND is_public = 1
       ORDER BY sort_order ASC, label ASC`,
    ).all<DbNewsletterCategory>();
    rows = results ?? [];
  } catch { /* table absente — preprod */ }

  const eligible: ReturnType<typeof toFrontendCategory>[] = [];
  for (const row of rows) {
    if (await userEligibleForCategory(env, String(payload.sub), row.audience_filter)) {
      eligible.push(toFrontendCategory(row));
    }
  }
  return json({ categories: eligible }, corsHeaders);
}

/**
 * GET /api/admin/newsletter/categories — liste admin (master only),
 * inclut les catégories archived et non-public.
 */
export async function handleListNewsletterCategoriesAdmin(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM newsletter_categories
       ORDER BY archived ASC, sort_order ASC, label ASC`,
    ).all<DbNewsletterCategory>();
    return json({ categories: (results ?? []).map(toFrontendCategory) }, corsHeaders);
  } catch {
    return json({ categories: [] }, corsHeaders);
  }
}

/**
 * Helpers Brevo Lists API. No-op silencieux si BREVO_API_KEY absent.
 * Préfixe « [SITE] » imposé pour distinguer les listes gérées par le code
 * des listes manuelles GASPE (Médias, Prospects experts, etc.) côté
 * dashboard Brevo.
 */
async function brevoCreateList(env: Env, label: string): Promise<number | null> {
  if (!env.BREVO_API_KEY) return null;
  const name = `[SITE] ${label}`;
  try {
    const res = await fetch("https://api.brevo.com/v3/contacts/lists", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      // folderId 1 = dossier par défaut. À paramétrer si besoin de cloisonner.
      body: JSON.stringify({ name, folderId: 1 }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      console.warn(`[brevo] createList échoué : ${err.message ?? res.status}`);
      return null;
    }
    const body = await res.json() as { id?: number };
    return body.id ?? null;
  } catch (err) {
    console.warn("[brevo] createList network error :", err);
    return null;
  }
}

async function brevoUpdateList(env: Env, listId: number, label: string): Promise<boolean> {
  if (!env.BREVO_API_KEY) return false;
  const name = `[SITE] ${label}`;
  try {
    const res = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}`, {
      method: "PUT",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({ name }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * POST /api/admin/newsletter/categories — création + push Brevo automatique
 * avec préfixe [SITE]. Body : { key, label, description?, audienceFilter?,
 * isPublic?, sortOrder? }.
 */
export async function handleCreateNewsletterCategory(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as {
    key?: string; label?: string; description?: string;
    audienceFilter?: string; isPublic?: boolean; sortOrder?: number;
    brevoListId?: number; // optionnel : lier à une liste Brevo existante
  };

  const key = (body.key ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const label = (body.label ?? "").trim();
  if (!key || !label) {
    return json({ error: "key et label requis" }, corsHeaders, 400);
  }

  const allowedFilters = ["all", "adherent_only", "social_3228", "college_a", "college_b", "college_c"];
  const audienceFilter = body.audienceFilter && allowedFilters.includes(body.audienceFilter)
    ? body.audienceFilter : "all";

  // Si brevoListId fourni → on lie à une liste existante (no création).
  // Sinon on tente de créer la liste côté Brevo avec préfixe [SITE].
  let brevoListId: number | null = body.brevoListId ?? null;
  if (!brevoListId) {
    brevoListId = await brevoCreateList(env, label);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO newsletter_categories
       (key, label, description, brevo_list_id, audience_filter, is_public, is_system, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    ).bind(
      key, label, body.description ?? null, brevoListId,
      audienceFilter, body.isPublic === false ? 0 : 1,
      body.sortOrder ?? 100,
    ).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique constraint/i.test(msg) || /primary key/i.test(msg)) {
      return json({ error: `La clé '${key}' existe déjà` }, corsHeaders, 409);
    }
    return json({ error: msg }, corsHeaders, 500);
  }

  const created = await env.DB.prepare(
    "SELECT * FROM newsletter_categories WHERE key = ?",
  ).bind(key).first<DbNewsletterCategory>();
  return json({ success: true, category: created ? toFrontendCategory(created) : null }, corsHeaders, 201);
}

/**
 * PATCH /api/admin/newsletter/categories/:key — update label/description/
 * audienceFilter/isPublic/sortOrder. Si label change ET la catégorie a un
 * brevoListId, on resync le nom côté Brevo.
 */
export async function handleUpdateNewsletterCategory(
  request: Request, env: Env, corsHeaders: Record<string, string>, key: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const before = await env.DB.prepare(
    "SELECT * FROM newsletter_categories WHERE key = ?",
  ).bind(key).first<DbNewsletterCategory>();
  if (!before) return json({ error: "Catégorie introuvable" }, corsHeaders, 404);

  const body = await request.json() as {
    label?: string; description?: string;
    audienceFilter?: string; isPublic?: boolean; sortOrder?: number;
    brevoListId?: number | null;
  };

  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.label === "string" && body.label.trim()) {
    updates.push("label = ?");
    values.push(body.label.trim());
  }
  if ("description" in body) {
    updates.push("description = ?");
    values.push(body.description ?? null);
  }
  if (typeof body.audienceFilter === "string") {
    const allowed = ["all", "adherent_only", "social_3228", "college_a", "college_b", "college_c"];
    if (allowed.includes(body.audienceFilter)) {
      updates.push("audience_filter = ?");
      values.push(body.audienceFilter);
    }
  }
  if (typeof body.isPublic === "boolean") {
    updates.push("is_public = ?");
    values.push(body.isPublic ? 1 : 0);
  }
  if (typeof body.sortOrder === "number") {
    updates.push("sort_order = ?");
    values.push(body.sortOrder);
  }
  if ("brevoListId" in body) {
    updates.push("brevo_list_id = ?");
    values.push(body.brevoListId ?? null);
  }

  if (updates.length === 0) return json({ error: "Aucun champ à modifier" }, corsHeaders, 400);

  updates.push("updated_at = datetime('now')");
  values.push(key);

  await env.DB.prepare(
    `UPDATE newsletter_categories SET ${updates.join(", ")} WHERE key = ?`,
  ).bind(...values).run();

  // Sync Brevo : si le label a changé ET qu'on a un list ID ET que la liste
  // est marquée is_system → push le nouveau nom.
  if (typeof body.label === "string" && body.label.trim() !== before.label
      && before.brevo_list_id && before.is_system === 1) {
    void brevoUpdateList(env, before.brevo_list_id, body.label.trim());
  }

  const updated = await env.DB.prepare(
    "SELECT * FROM newsletter_categories WHERE key = ?",
  ).bind(key).first<DbNewsletterCategory>();
  return json({ success: true, category: updated ? toFrontendCategory(updated) : null }, corsHeaders);
}

/**
 * DELETE /api/admin/newsletter/categories/:key — archive (pas DELETE physique).
 * Conserve les abonnements user_newsletter_subscriptions pour audit.
 */
export async function handleArchiveNewsletterCategory(
  request: Request, env: Env, corsHeaders: Record<string, string>, key: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await env.DB.prepare(
    "UPDATE newsletter_categories SET archived = 1, is_public = 0, updated_at = datetime('now') WHERE key = ?",
  ).bind(key).run();
  return json({ success: true }, corsHeaders);
}

/**
 * POST /api/admin/newsletter/categories/:key/sync-brevo — force resync de
 * tous les abonnés D1 vers la liste Brevo. Utile après création d'une
 * catégorie ou si la liste Brevo a été vidée à la main.
 */
export async function handleSyncCategoryToBrevo(
  request: Request, env: Env, corsHeaders: Record<string, string>, key: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const cat = await env.DB.prepare(
    "SELECT brevo_list_id FROM newsletter_categories WHERE key = ? AND archived = 0",
  ).bind(key).first<{ brevo_list_id: number | null }>();
  if (!cat?.brevo_list_id) {
    return json({ error: "Catégorie sans brevo_list_id" }, corsHeaders, 400);
  }
  if (!env.BREVO_API_KEY) {
    return json({ error: "BREVO_API_KEY non configuré" }, corsHeaders, 503);
  }

  const { results } = await env.DB.prepare(
    `SELECT u.email FROM user_newsletter_subscriptions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.category_key = ? AND u.email IS NOT NULL`,
  ).bind(key).all<{ email: string }>();
  const emails = (results ?? []).map((r) => r.email);

  if (emails.length === 0) return json({ success: true, synced: 0 }, corsHeaders);

  // Brevo /contacts/lists/:id/contacts/add accepte 150 emails par batch
  let synced = 0;
  for (let i = 0; i < emails.length; i += 150) {
    const batch = emails.slice(i, i + 150);
    try {
      const res = await fetch(
        `https://api.brevo.com/v3/contacts/lists/${cat.brevo_list_id}/contacts/add`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": env.BREVO_API_KEY,
          },
          body: JSON.stringify({ emails: batch }),
        },
      );
      if (res.ok) synced += batch.length;
    } catch (err) {
      console.warn("[brevo] syncCategory batch error :", err);
    }
  }
  return json({ success: true, synced, total: emails.length }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Newsletter Preferences
// ═══════════════════════════════════════════════════════════

// LEGACY (table 0003) — conservé pour rétro-compat dans les colonnes mais
// les lectures/écritures passent désormais par newsletter_categories +
// user_newsletter_subscriptions (migration 0040). Cette constante est
// utilisée uniquement comme fallback de la migration 0040 si elle n'a pas
// encore été appliquée.
const NEWSLETTER_COLUMNS = [
  "info_generales", "ag", "emploi", "formation_opco",
  "veille_juridique", "veille_sociale", "veille_surete",
  "veille_data", "veille_environnement", "actualites_gaspe",
] as const;

export async function handleGetPreferences(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  // Refonte session 56b : lit la table dynamique. Renvoie un map
  // { category_key: subscribed } limité aux catégories éligibles au user.
  const prefs: Record<string, boolean> = {};
  try {
    const { results: cats } = await env.DB.prepare(
      `SELECT key, audience_filter FROM newsletter_categories
       WHERE archived = 0 AND is_public = 1`,
    ).all<{ key: string; audience_filter: string }>();
    const subs = new Set<string>();
    try {
      const { results: subRows } = await env.DB.prepare(
        "SELECT category_key FROM user_newsletter_subscriptions WHERE user_id = ?",
      ).bind(payload.sub).all<{ category_key: string }>();
      for (const r of subRows ?? []) subs.add(r.category_key);
    } catch { /* table absente — preprod */ }

    for (const cat of cats ?? []) {
      if (await userEligibleForCategory(env, String(payload.sub), cat.audience_filter)) {
        prefs[cat.key] = subs.has(cat.key);
      }
    }
    return json({ preferences: prefs }, corsHeaders);
  } catch {
    // Fallback legacy : table 0040 absente → relit newsletter_preferences
    let row = await env.DB.prepare("SELECT * FROM newsletter_preferences WHERE user_id = ?").bind(payload.sub).first();
    if (!row) {
      await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(payload.sub).run();
      row = await env.DB.prepare("SELECT * FROM newsletter_preferences WHERE user_id = ?").bind(payload.sub).first();
    }
    for (const col of NEWSLETTER_COLUMNS) {
      prefs[col] = (row as Record<string, unknown>)?.[col] === 1;
    }
    return json({ preferences: prefs }, corsHeaders);
  }
}

export async function handleUpdatePreferences(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const body = await request.json() as Record<string, boolean>;

  // Refonte session 56b : on charge la table dynamique pour valider les keys
  // et les filtres d'audience. Une key inconnue ou non-éligible est ignorée
  // (fail closed côté sécu, pas de 400 pour ne pas bloquer un client legacy).
  let cats: Array<{ key: string; audience_filter: string; brevo_list_id: number | null }> = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT key, audience_filter, brevo_list_id FROM newsletter_categories
       WHERE archived = 0`,
    ).all<{ key: string; audience_filter: string; brevo_list_id: number | null }>();
    cats = results ?? [];
  } catch { /* table absente — fallback legacy ci-dessous */ }

  if (cats.length > 0) {
    const userIdStr = String(payload.sub);
    let touched = 0;
    for (const cat of cats) {
      if (!(cat.key in body)) continue;
      if (!await userEligibleForCategory(env, userIdStr, cat.audience_filter)) continue;
      const subscribed = !!body[cat.key];
      if (subscribed) {
        await env.DB.prepare(
          `INSERT OR IGNORE INTO user_newsletter_subscriptions
           (user_id, category_key, source) VALUES (?, ?, 'site')`,
        ).bind(userIdStr, cat.key).run();
      } else {
        await env.DB.prepare(
          "DELETE FROM user_newsletter_subscriptions WHERE user_id = ? AND category_key = ?",
        ).bind(userIdStr, cat.key).run();
      }
      touched += 1;
    }
    if (touched === 0) return json({ error: "Aucune préférence valide à modifier" }, corsHeaders, 400);

    // Sync Brevo non-bloquant : push les abonnements à jour
    try {
      const user = await env.DB.prepare(
        "SELECT email, first_name, last_name FROM users WHERE id = ?",
      ).bind(payload.sub).first<{ email: string; first_name?: string; last_name?: string }>();
      if (user?.email) await syncBrevoContact(env, user, userIdStr);
    } catch { /* non-bloquant */ }

    return json({ success: true }, corsHeaders);
  }

  // ─── Fallback legacy (table 0040 absente, pré-migration) ───
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const col of NEWSLETTER_COLUMNS) {
    if (col in body) {
      updates.push(`${col} = ?`);
      values.push(body[col] ? 1 : 0);
    }
  }
  if (updates.length === 0) return json({ error: "Aucune préférence à modifier" }, corsHeaders, 400);
  const existing = await env.DB.prepare("SELECT user_id FROM newsletter_preferences WHERE user_id = ?").bind(payload.sub).first();
  if (!existing) await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(payload.sub).run();
  updates.push("updated_at = datetime('now')");
  values.push(payload.sub);
  await env.DB.prepare(`UPDATE newsletter_preferences SET ${updates.join(", ")} WHERE user_id = ?`).bind(...values).run();
  return json({ success: true }, corsHeaders);
}

/**
 * Synchronise un contact Brevo avec ses abonnements D1.
 *
 * Refonte session 56b : lit la table dynamique newsletter_categories +
 * user_newsletter_subscriptions au lieu du mapping CATEGORY_TO_LIST_ENV
 * hard-codé. La signature accepte désormais `userId` directement (le
 * deuxième paramètre `prefs` legacy est ignoré, on relit en DB pour
 * éviter les races).
 *
 * Best-effort : silencieux si BREVO_API_KEY absent. Update
 * `users.brevo_synced_at` à chaque succès.
 */
async function syncBrevoContact(
  env: Env,
  user: { email: string; first_name?: string; last_name?: string },
  userId: string,
): Promise<boolean> {
  if (!env.BREVO_API_KEY) return false;

  // Toutes les catégories actives avec un brevo_list_id, et les
  // abonnements actuels du user. Différence → listIds (ajoute) /
  // unlinkListIds (retire).
  let cats: Array<{ key: string; brevo_list_id: number | null }> = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT key, brevo_list_id FROM newsletter_categories
       WHERE archived = 0 AND brevo_list_id IS NOT NULL`,
    ).all<{ key: string; brevo_list_id: number | null }>();
    cats = results ?? [];
  } catch { return false; }

  const subscribedKeys = new Set<string>();
  try {
    const { results } = await env.DB.prepare(
      "SELECT category_key FROM user_newsletter_subscriptions WHERE user_id = ?",
    ).bind(userId).all<{ category_key: string }>();
    for (const r of results ?? []) subscribedKeys.add(r.category_key);
  } catch { /* table absente */ }

  const listIds: number[] = [];
  const unlinkListIds: number[] = [];
  for (const cat of cats) {
    if (!cat.brevo_list_id) continue;
    if (subscribedKeys.has(cat.key)) listIds.push(cat.brevo_list_id);
    else unlinkListIds.push(cat.brevo_list_id);
  }
  if (listIds.length === 0 && unlinkListIds.length === 0) return false;

  const payload: Record<string, unknown> = {
    email: user.email,
    attributes: { PRENOM: user.first_name ?? "", NOM: user.last_name ?? "" },
    updateEnabled: true,
  };
  if (listIds.length > 0) payload.listIds = listIds;
  if (unlinkListIds.length > 0) payload.unlinkListIds = unlinkListIds;

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  const ok = res.ok || res.status === 204;
  if (ok) {
    try {
      await env.DB.prepare("UPDATE users SET brevo_synced_at = datetime('now') WHERE email = ?")
        .bind(user.email).run();
    } catch { /* colonne brevo_synced_at peut être absente (pré-0009) */ }
  }
  return ok;
}

// ═══════════════════════════════════════════════════════════
//  Contact form → Brevo email
// ═══════════════════════════════════════════════════════════

export async function handleContact(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const nom = sanitize((body.nom ?? "").trim());
  const email = (body.email ?? "").trim();
  const societe = sanitize((body.societe ?? "").trim());
  const sujet = sanitize((body.sujet ?? "").trim());
  const message = sanitize((body.message ?? "").trim());

  if (!nom || !email || !sujet || !message) {
    return json({ error: "Champs requis manquants" }, corsHeaders, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }

  if (nom.length > 200 || email.length > 200 || message.length > 5000) {
    return json({ error: "Contenu trop long" }, corsHeaders, 400);
  }

  await env.DB.prepare(
    "INSERT INTO contact_messages (id, nom, email, societe, sujet, message) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), nom, email, societe ?? "", sujet, message).run();

  // Notification interne via le helper centralisé (session 56)
  void sendBrevoTransactional(env, {
    to: [{ email: env.CONTACT_EMAIL || "contact@gaspe.fr", name: "GASPE" }],
    replyTo: { email, name: nom },
    subject: `[Contact GASPE] ${sujet}`,
    type: "contact_form",
    htmlContent: `<h2>Nouveau message de contact</h2>
<p><strong>Nom :</strong> ${sanitize(nom)}</p>
<p><strong>Email :</strong> ${sanitize(email)}</p>
${societe ? `<p><strong>Société :</strong> ${sanitize(societe)}</p>` : ""}
<p><strong>Sujet :</strong> ${sanitize(sujet)}</p>
<hr/>
<p>${sanitize(message).replace(/\n/g, "<br/>")}</p>`,
  });

  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Newsletter subscription
// ═══════════════════════════════════════════════════════════

/**
 * Admin only – renvoie la liste complète des abonnés newsletter avec
 *   - le détail par catégorie (10 booleans de `newsletter_preferences`)
 *   - les inscrits "legacy" (email seul, table `newsletter`) ajoutés via le formulaire public
 *
 * Utilisé par `/admin/newsletter/abonnes` pour permettre à la GASPE de voir
 * dynamiquement qui est abonné à quelle catégorie, avec filtrage et export CSV.
 */
export async function handleNewsletterSubscribers(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;
  const admin = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first<{ role: string }>();
  if (!admin || admin.role !== "admin") return json({ error: "Accès refusé" }, corsHeaders, 403);

  // Users + préférences jointes (null si l'utilisateur n'a jamais configuré ses préférences).
  // Colonnes canoniques : cf. `newsletter_preferences` migration 0003.
  let users: Array<Record<string, unknown>> = [];
  try {
    const { results } = await env.DB.prepare(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status,
             u.brevo_synced_at,
             p.info_generales, p.ag, p.emploi, p.formation_opco, p.veille_juridique,
             p.veille_sociale, p.veille_surete, p.veille_data,
             p.veille_environnement, p.actualites_gaspe,
             p.updated_at AS preferences_updated_at
      FROM users u
      LEFT JOIN newsletter_preferences p ON p.user_id = u.id
      WHERE u.status = 'approved'
      ORDER BY u.created_at DESC
    `).all();
    users = results ?? [];
  } catch { /* tables may not exist in fresh deployment */ }

  let legacy: Array<{ email: string; subscribed_at?: string }> = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT email, subscribed_at FROM newsletter ORDER BY subscribed_at DESC"
    ).all<{ email: string; subscribed_at?: string }>();
    legacy = results ?? [];
  } catch { /* legacy table may be empty */ }

  // Comptage par catégorie pour donner un aperçu rapide côté UI
  const counts: Record<string, number> = {};
  for (const key of ALL_NEWSLETTER_CATEGORIES) {
    counts[key] = users.filter((u) => u[key] === 1).length;
  }

  return json({
    users,
    legacy,
    counts,
    totalUsers: users.length,
    totalLegacy: legacy.length,
  }, corsHeaders);
}

export async function handleNewsletter(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }

  await env.DB.prepare("INSERT OR IGNORE INTO newsletter (email) VALUES (?)").bind(email).run();

  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Newsletter send → Brevo bulk email
// ═══════════════════════════════════════════════════════════

export async function handleNewsletterSend(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Admin only
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const admin = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first<{ role: string }>();
  if (!admin || admin.role !== "admin") {
    return json({ error: "Accès réservé aux administrateurs" }, corsHeaders, 403);
  }

  if (!env.BREVO_API_KEY) {
    return json({ error: "Clé API Brevo non configurée" }, corsHeaders, 500);
  }

  const body = await request.json() as { category: string; subject: string; htmlContent: string };

  if (!body.category || !body.subject?.trim() || !body.htmlContent?.trim()) {
    return json({ error: "Champs requis: category, subject, htmlContent" }, corsHeaders, 400);
  }

  // Validate category
  if (!NEWSLETTER_COLUMNS.includes(body.category as typeof NEWSLETTER_COLUMNS[number])) {
    return json({ error: `Catégorie invalide: ${body.category}` }, corsHeaders, 400);
  }

  // Find subscribed users: join users + newsletter_preferences where category = true
  const query = `
    SELECT u.email, u.name
    FROM users u
    INNER JOIN newsletter_preferences np ON np.user_id = u.id
    WHERE np.${body.category} = 1
      AND u.approved = 1
      AND u.archived = 0
  `;
  const { results } = await env.DB.prepare(query).all<{ email: string; name: string }>();
  const recipients = results ?? [];

  if (recipients.length === 0) {
    return json({ error: "Aucun abonné pour cette catégorie" }, corsHeaders, 400);
  }

  // Send via Brevo in batches of 50 (Brevo limit for transactional)
  const BATCH_SIZE = 50;
  let sentCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "GASPE", email: "ne-pas-repondre@gaspe.fr" },
          to: batch.map((r) => ({ email: r.email, name: r.name })),
          subject: body.subject,
          htmlContent: body.htmlContent,
        }),
      });

      if (brevoRes.ok) {
        sentCount += batch.length;
      } else {
        const err = await brevoRes.json().catch(() => ({})) as { message?: string };
        errors.push(err.message ?? `Brevo HTTP ${brevoRes.status}`);
      }
    } catch (err) {
      errors.push(`Erreur réseau batch ${i / BATCH_SIZE + 1}`);
    }
  }

  return json({
    success: errors.length === 0,
    sent: sentCount,
    total: recipients.length,
    errors: errors.length > 0 ? errors : undefined,
  }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Hydros Alumni Cross-publication — extrait dans ./handlers/hydros-cross-publication (J1 vague 7.c)
//  File upload R2 — extrait dans ./handlers/upload (J1 vague 7.b)
//  ENM Espace Numérique Maritime — extrait dans ./handlers/enm-import (J1 vague 7.d)
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  CMS pages système — extrait dans ./handlers/cms-pages (J1 vague 1.b)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  CMS custom sections — extrait dans ./handlers/cms-custom-sections (J1 vague 1.c)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  Media Files (R2) – extrait dans ./handlers/media + ./lib/uploads (J1 vague 5.f)
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  Newsletter drafts – CRUD (Phase 1 foundation)
//  Sending endpoints live separately once Brevo list IDs are configured.
// ═══════════════════════════════════════════════════════════

interface NlDraftRow {
  id: string;
  title: string;
  subject: string;
  preheader: string;
  blocks_json: string;
  status: "draft" | "sent" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
}

async function ensureNlDraftsTable(env: Env) {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nl_drafts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      preheader TEXT NOT NULL DEFAULT '',
      blocks_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  } catch { /* table may exist with different schema – ignore */ }
}

async function requireAdmin(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return { error: json({ error: "Non authentifié" }, corsHeaders, 401) };
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return { error: json({ error: "Accès refusé" }, corsHeaders, 403) };
  }
  return { userId: String(payload.sub) };
}



export async function handleNlDraftsList(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM nl_drafts ORDER BY updated_at DESC"
    ).all<NlDraftRow>();
    return json({ drafts: results ?? [] }, corsHeaders);
  } catch {
    return json({ drafts: [] }, corsHeaders);
  }
}

export async function handleNlDraftsGet(request: Request, env: Env, corsHeaders: Record<string, string>, id: string) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);
  const row = await env.DB.prepare("SELECT * FROM nl_drafts WHERE id = ?").bind(id).first<NlDraftRow>();
  return json({ draft: row ?? null }, corsHeaders);
}

export async function handleNlDraftsCreate(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);

  const body = await request.json() as {
    id?: string;
    title: string;
    subject?: string;
    preheader?: string;
    blocks?: unknown[];
  };

  if (!body.title || !body.title.trim()) {
    return json({ error: "Titre requis" }, corsHeaders, 400);
  }

  const id = body.id || `nl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const blocksJson = JSON.stringify(body.blocks ?? []);

  await env.DB.prepare(
    `INSERT INTO nl_drafts (id, title, subject, preheader, blocks_json, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?)`
  ).bind(id, body.title.trim(), body.subject ?? "", body.preheader ?? "", blocksJson, auth.userId, now, now).run();

  const row = await env.DB.prepare("SELECT * FROM nl_drafts WHERE id = ?").bind(id).first<NlDraftRow>();
  return json({ draft: row }, corsHeaders);
}

export async function handleNlDraftsUpdate(request: Request, env: Env, corsHeaders: Record<string, string>, id: string) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);

  const body = await request.json() as {
    title?: string;
    subject?: string;
    preheader?: string;
    blocks?: unknown[];
  };

  const existing = await env.DB.prepare("SELECT * FROM nl_drafts WHERE id = ?").bind(id).first<NlDraftRow>();
  if (!existing) return json({ error: "Brouillon introuvable" }, corsHeaders, 404);

  const now = new Date().toISOString();
  const title = body.title?.trim() ?? existing.title;
  const subject = body.subject ?? existing.subject;
  const preheader = body.preheader ?? existing.preheader;
  const blocksJson = body.blocks ? JSON.stringify(body.blocks) : existing.blocks_json;

  await env.DB.prepare(
    `UPDATE nl_drafts SET title = ?, subject = ?, preheader = ?, blocks_json = ?, updated_at = ? WHERE id = ?`
  ).bind(title, subject, preheader, blocksJson, now, id).run();

  return json({ success: true }, corsHeaders);
}

export async function handleNlDraftsDelete(request: Request, env: Env, corsHeaders: Record<string, string>, id: string) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);
  // Soft-delete (P2-2 session 54+) : preserve les brouillons archivés
  // pour reprise éventuelle.
  try {
    await env.DB.prepare(
      "UPDATE nl_drafts SET is_archived = 1, updated_at = datetime('now') WHERE id = ?",
    ).bind(id).run();
  } catch {
    await env.DB.prepare("DELETE FROM nl_drafts WHERE id = ?").bind(id).run();
  }
  return json({ success: true, archived: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════════════
// Newsletter v2 – Phase 3/4/6 : test-send, bulk-send, webhook, unsub
// Bloqué par config Brevo (list IDs + webhook secret). Les endpoints
// existent pour permettre l'intégration complète dès que les secrets
// sont provisionnés via `wrangler secret put …`.
// ═══════════════════════════════════════════════════════════════════

interface NlBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

/**
 * Mapping catégorie D1 (colonne `newsletter_preferences`) → env var du list ID Brevo.
 * Les clés correspondent exactement aux colonnes de la table (migration 0003) et à
 * `NEWSLETTER_CATEGORIES` côté frontend (`src/lib/auth/types.ts`).
 */
const CATEGORY_TO_LIST_ENV: Record<string, keyof Env> = {
  info_generales: "BREVO_LIST_INFO_GENERALES",
  ag: "BREVO_LIST_AG",
  emploi: "BREVO_LIST_EMPLOI",
  formation_opco: "BREVO_LIST_FORMATION_OPCO",
  veille_juridique: "BREVO_LIST_VEILLE_JURIDIQUE",
  veille_sociale: "BREVO_LIST_VEILLE_SOCIALE",
  veille_surete: "BREVO_LIST_VEILLE_SURETE",
  veille_data: "BREVO_LIST_VEILLE_DATA",
  veille_environnement: "BREVO_LIST_VEILLE_ENVIRONNEMENT",
  actualites_gaspe: "BREVO_LIST_ACTUALITES_GASPE",
};

const ALL_NEWSLETTER_CATEGORIES = Object.keys(CATEGORY_TO_LIST_ENV);

/**
 * Rendu HTML minimal côté Worker – la charte complète reste dans le renderer
 * frontend. Pour le POC, on envoie le HTML pré-rendu par le client (champ
 * `htmlContent` dans le body de l'envoi). Plus tard : récupérer les blocs
 * JSON et rerender côté Worker pour garantir intégrité charte.
 */
function simpleHtmlFromBlocks(blocks: NlBlock[]): string {
  const parts = blocks.map((b) => {
    const type = b.type;
    if (type === "heading") return `<h2 style="font-family:Exo 2,sans-serif;color:#1B7E8A">${String(b.text ?? "")}</h2>`;
    if (type === "paragraph") return `<p style="font-family:DM Sans,sans-serif;color:#222">${String(b.text ?? "")}</p>`;
    if (type === "button") return `<p><a href="${String(b.url ?? "#")}" style="background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none">${String(b.label ?? "En savoir plus")}</a></p>`;
    return "";
  });
  return `<!DOCTYPE html><html><body style="background:#F5F3F0;padding:24px">${parts.join("")}</body></html>`;
}

async function loadDraftOrError(env: Env, id: string) {
  const row = await env.DB.prepare("SELECT * FROM nl_drafts WHERE id = ?").bind(id).first<NlDraftRow>();
  return row;
}

export async function handleNewsletterTestSend(request: Request, env: Env, corsHeaders: Record<string, string>, draftId: string) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
  if ("error" in auth) return auth.error;

  if (!env.BREVO_API_KEY) {
    return json({ error: "BREVO_API_KEY non configurée sur le Worker" }, corsHeaders, 503);
  }

  const body = await request.json().catch(() => ({})) as { recipients?: string[] };
  const recipients = (body.recipients ?? []).filter((e) => typeof e === "string" && /@/.test(e));
  if (recipients.length === 0 || recipients.length > 5) {
    return json({ error: "Fournir 1 à 5 emails de test" }, corsHeaders, 400);
  }

  await ensureNlDraftsTable(env);
  const draft = await loadDraftOrError(env, draftId);
  if (!draft) return json({ error: "Brouillon introuvable" }, corsHeaders, 404);

  let blocks: NlBlock[] = [];
  try { blocks = JSON.parse(draft.blocks_json) as NlBlock[]; } catch { /* empty */ }
  const html = simpleHtmlFromBlocks(blocks);

  const senderEmail = env.BREVO_SENDER_EMAIL ?? env.CONTACT_EMAIL ?? "contact@gaspe.fr";
  const senderName = env.BREVO_SENDER_NAME ?? "GASPE";

  // Session 56 — passe par le helper centralisé. Note : Brevo limite à 99
  // destinataires par appel `/v3/smtp/email`, ici on a max 5 (validé en amont).
  const result = await sendBrevoTransactional(env, {
    to: recipients.map((email) => ({ email })),
    sender: { email: senderEmail, name: senderName },
    replyTo: env.BREVO_REPLY_TO ? { email: env.BREVO_REPLY_TO } : undefined,
    subject: `[TEST] ${draft.subject}`,
    htmlContent: html,
    type: "newsletter_test",
    entityId: draftId,
  });

  if (!result.ok) {
    return json({ error: `Brevo a refusé l'envoi : ${result.error ?? "raison inconnue"}` }, corsHeaders, 502);
  }
  return json({ success: true, sent: recipients.length, brevoMessageId: result.brevoMessageId }, corsHeaders);
}

export async function handleNewsletterBulkSend(request: Request, env: Env, corsHeaders: Record<string, string>, draftId: string) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({})) as { category?: string };
  const category = body.category ?? "";
  const listEnvKey = CATEGORY_TO_LIST_ENV[category];
  if (!listEnvKey) return json({ error: "Catégorie invalide" }, corsHeaders, 400);

  const listId = env[listEnvKey] as string | undefined;
  if (!env.BREVO_API_KEY || !listId) {
    return json({
      error: "Envoi production non configuré",
      missing: !env.BREVO_API_KEY ? ["BREVO_API_KEY"] : [listEnvKey],
      hint: "Configurer via `wrangler secret put` puis redéployer.",
    }, corsHeaders, 503);
  }

  await ensureNlDraftsTable(env);
  const draft = await loadDraftOrError(env, draftId);
  if (!draft) return json({ error: "Brouillon introuvable" }, corsHeaders, 404);

  let blocks: NlBlock[] = [];
  try { blocks = JSON.parse(draft.blocks_json) as NlBlock[]; } catch { /* empty */ }
  const html = simpleHtmlFromBlocks(blocks);

  const senderEmail = env.BREVO_SENDER_EMAIL ?? env.CONTACT_EMAIL ?? "contact@gaspe.fr";
  const senderName = env.BREVO_SENDER_NAME ?? "GASPE";

  // Campagne Brevo classique via "email campaigns" – plus scalable que SMTP direct.
  const res = await fetch("https://api.brevo.com/v3/emailCampaigns", {
    method: "POST",
    headers: { "accept": "application/json", "content-type": "application/json", "api-key": env.BREVO_API_KEY },
    body: JSON.stringify({
      name: `GASPE – ${draft.title} [${category}]`,
      subject: draft.subject,
      sender: { email: senderEmail, name: senderName },
      replyTo: env.BREVO_REPLY_TO ?? senderEmail,
      htmlContent: html,
      recipients: { listIds: [Number(listId)] },
    }),
  });

  const campaignResp = await res.json().catch(() => ({})) as { id?: number; message?: string };
  if (!res.ok) {
    return json({ error: `Brevo erreur ${res.status}`, details: campaignResp }, corsHeaders, 502);
  }

  // Déclenchement immédiat de la campagne
  if (campaignResp.id) {
    await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignResp.id}/sendNow`, {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY },
    });
  }

  // Trace l'envoi dans nl_sends pour suivi admin
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nl_sends (
      id TEXT PRIMARY KEY, draft_id TEXT NOT NULL, category TEXT, brevo_campaign_id TEXT,
      sent_at TEXT NOT NULL, recipients_count INTEGER DEFAULT 0
    )`).run();
    const sendId = `send-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await env.DB.prepare(
      "INSERT INTO nl_sends (id, draft_id, category, brevo_campaign_id, sent_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(sendId, draftId, category, String(campaignResp.id ?? ""), new Date().toISOString()).run();
    // Marque le draft comme "sent"
    await env.DB.prepare("UPDATE nl_drafts SET status = 'sent', updated_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), draftId).run();
  } catch { /* non bloquant */ }

  return json({ success: true, campaignId: campaignResp.id }, corsHeaders);
}

/**
 * Webhook Brevo – reçoit les événements (open, click, bounce, unsubscribe).
 * Signature HMAC-SHA256 vérifiée avec BREVO_WEBHOOK_SECRET si configuré.
 * Les events sont persistés dans nl_events pour analyse admin.
 */
export async function handleBrevoWebhook(request: Request, env: Env, corsHeaders: Record<string, string>) {
  if (env.BREVO_WEBHOOK_SECRET) {
    // Brevo envoie un header `x-brevo-signature` (HMAC-SHA256 sur le body).
    const signature = request.headers.get("x-brevo-signature") ?? "";
    const raw = await request.clone().text();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(env.BREVO_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(raw));
    const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (signature !== expected) return json({ error: "Signature invalide" }, corsHeaders, 401);
  }

  const body = await request.json().catch(() => null) as null | {
    event?: string;
    email?: string;
    "message-id"?: string;
    date?: string;
    subject?: string;
  };
  if (!body || !body.event || !body.email) return json({ error: "Payload invalide" }, corsHeaders, 400);

  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nl_events (
      id TEXT PRIMARY KEY, event TEXT, email TEXT, message_id TEXT, subject TEXT, occurred_at TEXT
    )`).run();
    const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await env.DB.prepare(
      "INSERT INTO nl_events (id, event, email, message_id, subject, occurred_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, body.event, body.email, body["message-id"] ?? null, body.subject ?? null, body.date ?? new Date().toISOString()).run();

    // Si désinscription ou bounce hard → désabonner de toutes les catégories.
    if (body.event === "unsubscribed" || body.event === "hard_bounce") {
      const setClause = ALL_NEWSLETTER_CATEGORIES.map((c) => `${c} = 0`).join(", ");
      await env.DB.prepare(`
        UPDATE newsletter_preferences SET ${setClause}
        WHERE user_id IN (SELECT id FROM users WHERE email = ?)
      `).bind(body.email).run();
    }
  } catch { /* swallow */ }

  return json({ success: true }, corsHeaders);
}

/**
 * Désinscription publique – la page `/newsletter/unsubscribe?token=…` appelle
 * ce endpoint avec un token HMAC signé par NEWSLETTER_UNSUB_SECRET.
 * Le token est de la forme `<email-base64>.<hmac-hex>`.
 */
export async function handleNewsletterUnsubscribe(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json().catch(() => ({})) as { token?: string; categories?: string[] };
  const token = body.token ?? "";
  if (!token || !env.NEWSLETTER_UNSUB_SECRET) {
    return json({ error: "Token manquant ou secret non configuré" }, corsHeaders, 400);
  }

  const [emailB64, sig] = token.split(".");
  if (!emailB64 || !sig) return json({ error: "Token malformé" }, corsHeaders, 400);

  const email = atob(emailB64);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(env.NEWSLETTER_UNSUB_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(email));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (sig !== expected) return json({ error: "Signature invalide" }, corsHeaders, 401);

  // Désinscrit des catégories demandées (ou toutes si vide).
  const cats = (body.categories && body.categories.length > 0)
    ? body.categories.filter((c) => ALL_NEWSLETTER_CATEGORIES.includes(c))
    : ALL_NEWSLETTER_CATEGORIES;
  const setClause = cats.map((c) => `${c} = 0`).join(", ");

  await env.DB.prepare(`
    UPDATE newsletter_preferences SET ${setClause}
    WHERE user_id IN (SELECT id FROM users WHERE email = ?)
  `).bind(email).run();

  // Pour les inscrits legacy (table newsletter)
  await env.DB.prepare("DELETE FROM newsletter WHERE email = ?").bind(email).run();

  return json({ success: true, email, categoriesDisabled: cats }, corsHeaders);
}