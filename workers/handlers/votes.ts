/**
 * Handlers votes AG/AGE + sociaux (session 38, migrations 0018-0019).
 *
 * Permission staff `manage_votes` requise pour POST/PATCH/DELETE +
 * results + close. List/get : adhérent ou admin. Submit : adhérent
 * titulaire OU suppléant désigné (INSERT OR REPLACE).
 *
 * Inclut les endpoints suppléant /api/users/me/suppleant (GET + PATCH)
 * car le pattern de "désignation suppléant" sert exclusivement au flow
 * vote (audience AG_AB / social_3228, migration 0019).
 *
 * Extrait de `workers/api.ts` en J1 vague 6.d.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken, requireStaffPermission, requireJwt } from "../lib/auth";
import type { Env } from "../lib/env";

interface DbVote {
  id: string;
  title: string;
  description: string | null;
  type: string;
  audience: string;
  options_json: string | null;
  status: string;
  closes_at: string | null;
  created_by: string;
  created_at: string;
  closed_at: string | null;
  closed_by: string | null;
}

interface DbVoteResponse {
  id: string;
  vote_id: string;
  organization_id: number;
  submitted_by: string;
  response_json: string;
  submitted_at: string;
}

function toFrontendVote(row: DbVote) {
  let options: unknown[] = [];
  if (row.options_json) {
    try {
      const parsed = JSON.parse(row.options_json);
      if (Array.isArray(parsed)) options = parsed;
    } catch { /* malformed, ignore */ }
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    audience: row.audience,
    options,
    status: row.status,
    closesAt: row.closes_at ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    closedAt: row.closed_at ?? undefined,
    closedBy: row.closed_by ?? undefined,
  };
}

function toFrontendVoteResponse(row: DbVoteResponse) {
  let response: unknown = "";
  try {
    response = JSON.parse(row.response_json);
  } catch { /* ignore */ }
  return {
    id: row.id,
    voteId: row.vote_id,
    organizationId: String(row.organization_id),
    submittedBy: row.submitted_by,
    response,
    submittedAt: row.submitted_at,
  };
}

/**
 * Crée les tables votes/vote_responses si absentes (défensif, en cas de
 * déploiement avant migration). Réplique 0018_votes.sql.
 */
async function ensureVotesTables(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      audience TEXT NOT NULL,
      options_json TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      closes_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      closed_by TEXT
    )`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS vote_responses (
      id TEXT PRIMARY KEY,
      vote_id TEXT NOT NULL,
      organization_id INTEGER NOT NULL,
      submitted_by TEXT NOT NULL,
      response_json TEXT NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(vote_id, organization_id)
    )`).run();
  } catch { /* ignore – tables may already exist */ }
}

/** Vrai si le payload role peut voir les détails d'un vote (admin, ou adhérent dont l'org est éligible). */
function canSeeVote(role: string): boolean {
  return role === "admin" || role === "adherent";
}

/** Détermine si une organisation est éligible pour un vote selon son audience. */
function isOrgEligible(audience: string, college: string | null, social3228: number | null): boolean {
  if (audience === "ag_ab") return college === "A" || college === "B";
  if (audience === "social_3228") return social3228 === 1;
  return false;
}

export async function handleListVotes(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || !canSeeVote(payload.role)) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await ensureVotesTables(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM votes ORDER BY datetime(created_at) DESC",
  ).all<DbVote>();
  const allVotes = (results ?? []).map(toFrontendVote);

  // Pour les adhérents, filtrer aux votes auxquels leur organisation peut répondre
  if (payload.role === "adherent") {
    const user = await env.DB.prepare(
      "SELECT u.organization_id, o.college, o.social3228 FROM users u LEFT JOIN organizations o ON o.id = u.organization_id WHERE u.id = ?",
    ).bind(payload.sub).first<{ organization_id: string | null; college: string | null; social3228: number | null }>();
    if (!user || !user.organization_id) {
      return json({ votes: [] }, corsHeaders);
    }
    const eligible = allVotes.filter((v) => isOrgEligible(v.audience, user.college, user.social3228));
    return json({ votes: eligible, organizationId: user.organization_id }, corsHeaders);
  }

  return json({ votes: allVotes }, corsHeaders);
}

export async function handleCreateVote(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_votes");
  if ("error" in auth) return auth.error;

  await ensureVotesTables(env);
  const body = await request.json() as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type : "";
  const audience = typeof body.audience === "string" ? body.audience : "";
  if (!title || !["single_choice", "multiple_choice", "text", "ranking", "date_selection"].includes(type)) {
    return json({ error: "Champs invalides : title et type requis" }, corsHeaders, 400);
  }
  if (!["ag_ab", "social_3228"].includes(audience)) {
    return json({ error: "Audience invalide" }, corsHeaders, 400);
  }

  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const closesAt = typeof body.closesAt === "string" && body.closesAt ? body.closesAt : null;
  const optionsJson = body.options !== undefined ? JSON.stringify(body.options) : null;

  const id = `vote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await env.DB.prepare(
    `INSERT INTO votes (id, title, description, type, audience, options_json, status, closes_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
  ).bind(id, title, description, type, audience, optionsJson, closesAt, auth.userId).run();

  const row = await env.DB.prepare("SELECT * FROM votes WHERE id = ?").bind(id).first<DbVote>();
  return json({ success: true, vote: row ? toFrontendVote(row) : null }, corsHeaders);
}

export async function handleGetVote(
  request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || !canSeeVote(payload.role)) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await ensureVotesTables(env);
  const row = await env.DB.prepare("SELECT * FROM votes WHERE id = ?").bind(voteId).first<DbVote>();
  if (!row) return json({ error: "Vote introuvable" }, corsHeaders, 404);

  // Auto-close si dépassé
  if (row.status === "open" && row.closes_at && new Date(row.closes_at).getTime() < Date.now()) {
    await env.DB.prepare("UPDATE votes SET status = 'closed', closed_at = datetime('now') WHERE id = ?")
      .bind(voteId).run();
    row.status = "closed";
    row.closed_at = new Date().toISOString();
  }

  const vote = toFrontendVote(row);

  // Récupère la réponse de mon organisation (s'il y en a une)
  let myResponse: ReturnType<typeof toFrontendVoteResponse> | null = null;
  if (payload.role === "adherent") {
    const user = await env.DB.prepare(
      "SELECT organization_id FROM users WHERE id = ?",
    ).bind(payload.sub).first<{ organization_id: string | null }>();
    if (user?.organization_id) {
      const respRow = await env.DB.prepare(
        "SELECT * FROM vote_responses WHERE vote_id = ? AND organization_id = ?",
      ).bind(voteId, user.organization_id).first<DbVoteResponse>();
      if (respRow) myResponse = toFrontendVoteResponse(respRow);
    }
  }

  return json({ vote, myResponse }, corsHeaders);
}

export async function handleSubmitVoteResponse(
  request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "adherent") {
    return json({ error: "Réservé aux adhérents" }, corsHeaders, 403);
  }

  await ensureVotesTables(env);
  const vote = await env.DB.prepare("SELECT * FROM votes WHERE id = ?").bind(voteId).first<DbVote>();
  if (!vote) return json({ error: "Vote introuvable" }, corsHeaders, 404);
  if (vote.status !== "open") return json({ error: "Vote clôturé" }, corsHeaders, 409);
  if (vote.closes_at && new Date(vote.closes_at).getTime() < Date.now()) {
    return json({ error: "Vote clôturé (date dépassée)" }, corsHeaders, 409);
  }

  const user = await env.DB.prepare(
    "SELECT u.organization_id, u.is_primary, u.suppleant_user_id, o.college, o.social3228 FROM users u LEFT JOIN organizations o ON o.id = u.organization_id WHERE u.id = ?",
  ).bind(payload.sub).first<{ organization_id: string | null; is_primary: number; suppleant_user_id: string | null; college: string | null; social3228: number | null }>();
  if (!user || !user.organization_id) {
    return json({ error: "Utilisateur sans organisation" }, corsHeaders, 403);
  }
  if (!isOrgEligible(vote.audience, user.college, user.social3228)) {
    return json({ error: "Votre organisation n'est pas éligible pour ce vote" }, corsHeaders, 403);
  }

  // Vérifie que le user est titulaire OU suppléant de cette organisation
  // Suppléant = user dont l'id apparaît comme `suppleant_user_id` chez le titulaire de la même org
  let canVote = user.is_primary === 1; // titulaire
  if (!canVote) {
    const titulaire = await env.DB.prepare(
      "SELECT id FROM users WHERE organization_id = ? AND is_primary = 1 AND suppleant_user_id = ?",
    ).bind(user.organization_id, payload.sub).first<{ id: string }>();
    canVote = !!titulaire;
  }
  if (!canVote) {
    return json({ error: "Seuls le titulaire et le suppléant peuvent voter" }, corsHeaders, 403);
  }

  const body = await request.json() as Record<string, unknown>;
  const response = body.response;
  if (response === undefined || response === null) {
    return json({ error: "Champ 'response' manquant" }, corsHeaders, 400);
  }

  const responseJson = JSON.stringify(response);
  const respId = `resp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  // INSERT OR REPLACE permet au titulaire de réécraser la réponse du suppléant et inversement.
  await env.DB.prepare(
    `INSERT INTO vote_responses (id, vote_id, organization_id, submitted_by, response_json, submitted_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(vote_id, organization_id)
     DO UPDATE SET submitted_by = excluded.submitted_by, response_json = excluded.response_json, submitted_at = datetime('now')`,
  ).bind(respId, voteId, user.organization_id, String(payload.sub), responseJson).run();

  const row = await env.DB.prepare(
    "SELECT * FROM vote_responses WHERE vote_id = ? AND organization_id = ?",
  ).bind(voteId, user.organization_id).first<DbVoteResponse>();

  return json({ success: true, response: row ? toFrontendVoteResponse(row) : null }, corsHeaders);
}

export async function handleVoteResults(
  request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_votes");
  if ("error" in auth) return auth.error;

  await ensureVotesTables(env);
  const vote = await env.DB.prepare("SELECT * FROM votes WHERE id = ?").bind(voteId).first<DbVote>();
  if (!vote) return json({ error: "Vote introuvable" }, corsHeaders, 404);

  // Organisations éligibles
  let orgFilterClause = "";
  if (vote.audience === "ag_ab") orgFilterClause = "WHERE college IN ('A', 'B') AND archived = 0";
  else if (vote.audience === "social_3228") orgFilterClause = "WHERE social3228 = 1 AND archived = 0";
  else orgFilterClause = "WHERE archived = 0";

  const { results: orgs } = await env.DB.prepare(
    `SELECT id, name FROM organizations ${orgFilterClause}`,
  ).all<{ id: string; name: string }>();
  const orgList = orgs ?? [];

  // Réponses
  const { results: responses } = await env.DB.prepare(
    `SELECT vr.*, u.name AS submitted_by_name, o.name AS organization_name
     FROM vote_responses vr
     LEFT JOIN users u ON u.id = vr.submitted_by
     LEFT JOIN organizations o ON o.id = vr.organization_id
     WHERE vr.vote_id = ?`,
  ).bind(voteId).all<DbVoteResponse & { submitted_by_name: string | null; organization_name: string | null }>();
  const respList = responses ?? [];

  const respondedOrgIds = new Set(respList.map((r) => String(r.organization_id)));

  // Agrégation par option (pour single/multiple/ranking)
  const optionCounts: Record<string, number> = {};
  const textResponses: Array<{ organizationName: string; response: string; submittedAt: string }> = [];
  for (const r of respList) {
    let parsed: unknown = "";
    try { parsed = JSON.parse(r.response_json); } catch { /* ignore */ }
    if (vote.type === "text") {
      textResponses.push({
        organizationName: r.organization_name ?? "Compagnie",
        response: typeof parsed === "string" ? parsed : JSON.stringify(parsed),
        submittedAt: r.submitted_at,
      });
    } else if (Array.isArray(parsed)) {
      for (const opt of parsed) {
        if (typeof opt === "string") optionCounts[opt] = (optionCounts[opt] ?? 0) + 1;
      }
    } else if (typeof parsed === "string") {
      optionCounts[parsed] = (optionCounts[parsed] ?? 0) + 1;
    }
  }

  // Récupère emails des titulaires/suppléants pour mailto relance
  const nonRespOrgIds = orgList.filter((o) => !respondedOrgIds.has(o.id)).map((o) => o.id);
  const nonResponders: Array<{ organizationId: string; organizationName: string; titulaireEmail?: string; suppleantEmail?: string }> = [];
  if (nonRespOrgIds.length > 0) {
    const placeholders = nonRespOrgIds.map(() => "?").join(",");
    const { results: nonRespUsers } = await env.DB.prepare(
      `SELECT organization_id, email, is_primary, suppleant_user_id, id FROM users WHERE organization_id IN (${placeholders}) AND archived = 0`,
    ).bind(...nonRespOrgIds).all<{ organization_id: string; email: string; is_primary: number; suppleant_user_id: string | null; id: string }>();
    const usersByOrg = new Map<string, typeof nonRespUsers>();
    for (const u of nonRespUsers ?? []) {
      const arr = usersByOrg.get(u.organization_id) ?? [];
      arr.push(u);
      usersByOrg.set(u.organization_id, arr);
    }
    for (const orgId of nonRespOrgIds) {
      const orgName = orgList.find((o) => o.id === orgId)?.name ?? "Compagnie";
      const users = usersByOrg.get(orgId) ?? [];
      const titulaire = users.find((u) => u.is_primary === 1);
      const suppleantId = titulaire?.suppleant_user_id;
      const suppleant = suppleantId ? users.find((u) => u.id === suppleantId) : undefined;
      nonResponders.push({
        organizationId: orgId,
        organizationName: orgName,
        titulaireEmail: titulaire?.email,
        suppleantEmail: suppleant?.email,
      });
    }
  }

  return json({
    voteId,
    totalEligible: orgList.length,
    totalResponded: respondedOrgIds.size,
    optionCounts: vote.type === "text" ? undefined : optionCounts,
    textResponses: vote.type === "text" ? textResponses : undefined,
    responders: respList.map((r) => ({
      organizationId: String(r.organization_id),
      organizationName: r.organization_name ?? "Compagnie",
      submittedAt: r.submitted_at,
      submittedByName: r.submitted_by_name ?? undefined,
    })),
    nonResponders,
  }, corsHeaders);
}

export async function handleCloseVote(
  request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_votes");
  if ("error" in auth) return auth.error;

  await ensureVotesTables(env);
  await env.DB.prepare(
    "UPDATE votes SET status = 'closed', closed_at = datetime('now'), closed_by = ? WHERE id = ?",
  ).bind(auth.userId, voteId).run();
  return json({ success: true }, corsHeaders);
}

export async function handleDeleteVote(
  request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_votes");
  if ("error" in auth) return auth.error;

  await ensureVotesTables(env);
  await env.DB.prepare("DELETE FROM vote_responses WHERE vote_id = ?").bind(voteId).run();
  await env.DB.prepare("DELETE FROM votes WHERE id = ?").bind(voteId).run();
  return json({ success: true }, corsHeaders);
}

export async function handleGetMySuppleant(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const me = await env.DB.prepare(
    "SELECT id, organization_id, is_primary, suppleant_user_id FROM users WHERE id = ?",
  ).bind(payload.sub).first<{ id: string; organization_id: string | null; is_primary: number; suppleant_user_id: string | null }>();
  if (!me) return json({ error: "Utilisateur introuvable" }, corsHeaders, 404);

  let suppleant: { id: string; name: string; email: string } | null = null;
  if (me.suppleant_user_id) {
    const sup = await env.DB.prepare(
      "SELECT id, name, email FROM users WHERE id = ?",
    ).bind(me.suppleant_user_id).first<{ id: string; name: string; email: string }>();
    if (sup) suppleant = sup;
  }

  // Liste des candidats potentiels suppléants (autres users de la même org)
  let candidates: Array<{ id: string; name: string; email: string }> = [];
  if (me.organization_id && me.is_primary === 1) {
    const { results } = await env.DB.prepare(
      "SELECT id, name, email FROM users WHERE organization_id = ? AND id != ? AND archived = 0 ORDER BY name",
    ).bind(me.organization_id, me.id).all<{ id: string; name: string; email: string }>();
    candidates = results ?? [];
  }

  return json({
    isPrimary: me.is_primary === 1,
    suppleant,
    candidates,
  }, corsHeaders);
}

export async function handleSetMySuppleant(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const me = await env.DB.prepare(
    "SELECT organization_id, is_primary FROM users WHERE id = ?",
  ).bind(payload.sub).first<{ organization_id: string | null; is_primary: number }>();
  if (!me || me.is_primary !== 1) {
    return json({ error: "Seul le titulaire peut désigner un suppléant" }, corsHeaders, 403);
  }
  if (!me.organization_id) {
    return json({ error: "Utilisateur sans organisation" }, corsHeaders, 400);
  }

  const body = await request.json() as Record<string, unknown>;
  const supId = body.suppleantUserId;
  if (supId === null || supId === undefined || supId === "") {
    // Désigne null = retire le suppléant
    await env.DB.prepare("UPDATE users SET suppleant_user_id = NULL WHERE id = ?").bind(payload.sub).run();
    return json({ success: true, suppleant: null }, corsHeaders);
  }
  if (typeof supId !== "string") {
    return json({ error: "suppleantUserId invalide" }, corsHeaders, 400);
  }

  // Vérifie que le candidat existe ET appartient à la même organisation
  const cand = await env.DB.prepare(
    "SELECT id, name, email FROM users WHERE id = ? AND organization_id = ? AND archived = 0",
  ).bind(supId, me.organization_id).first<{ id: string; name: string; email: string }>();
  if (!cand) {
    return json({ error: "Candidat suppléant introuvable dans votre organisation" }, corsHeaders, 400);
  }

  await env.DB.prepare("UPDATE users SET suppleant_user_id = ? WHERE id = ?").bind(supId, payload.sub).run();
  return json({ success: true, suppleant: cand }, corsHeaders);
}
