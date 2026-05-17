/**
 * Handlers invitations d'équipe (table invitations).
 *
 * - POST /api/organizations/:id/invite — admin OR primary contact.
 *   Génère un token, envoie un email Brevo, crée la ligne invitations.
 * - GET /api/organizations/:id/invitations — admin/JWT.
 * - POST /api/invitations/:token/accept — public, valide le token,
 *   crée user pré-approuvé + auth + newsletter prefs, auto-login.
 *
 * Extrait de `workers/api.ts` en J1 vague 6.c.
 */

import { signJwt } from "../jwt";
import { json } from "../lib/json";
import { setTokenCookie, requireJwt } from "../lib/auth";
import { sanitize } from "../lib/sanitize";
import { hashPasswordServer } from "../lib/crypto";
import { sendBrevoTransactional } from "../lib/brevo";
import { renderEmailLayout, renderEmailButton, renderEmailParagraph } from "../lib/brevo-templates";
import { type DbUser, toFrontendUser } from "../lib/users";
import { SITE_URL } from "../lib/constants";
import type { Env } from "../lib/env";

export async function handleInviteContact(
  request: Request, env: Env, corsHeaders: Record<string, string>, orgId: string,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  // Only primary contact or admin can invite
  if (payload.role !== "admin") {
    const user = await env.DB.prepare("SELECT is_primary, organization_id FROM users WHERE id = ?").bind(payload.sub).first<{ is_primary: number; organization_id: string | null }>();
    if (!user || user.organization_id !== orgId || user.is_primary !== 1) {
      return json({ error: "Seul le responsable de la compagnie peut inviter" }, corsHeaders, 403);
    }
  }

  const body = await request.json() as Record<string, string>;
  const { email, name, orgRole } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }

  // Check if email is already registered
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(email.trim()).first();
  if (existing) {
    return json({ error: "Un compte existe déjà avec cet email" }, corsHeaders, 409);
  }

  // Check if invitation already pending
  const pendingInvite = await env.DB.prepare(
    "SELECT id FROM invitations WHERE email = ? COLLATE NOCASE AND organization_id = ? AND accepted = 0 AND expires_at > datetime('now')",
  ).bind(email.trim(), orgId).first();
  if (pendingInvite) {
    return json({ error: "Une invitation est déjà en cours pour cet email" }, corsHeaders, 409);
  }

  // Generate invitation token
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const inviteToken = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  const inviteId = `invite-${Date.now()}`;

  await env.DB.prepare(
    "INSERT INTO invitations (id, organization_id, invited_by, email, name, org_role, token, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(inviteId, orgId, payload.sub, email.trim(), name?.trim() ?? null, orgRole ?? null, inviteToken, expiresAt).run();

  // Send invitation email via Brevo (session 56 — helper centralisé)
  const org = await env.DB.prepare("SELECT name FROM organizations WHERE id = ?").bind(orgId).first<{ name: string }>();
  const inviter = await env.DB.prepare("SELECT name FROM users WHERE id = ?").bind(payload.sub).first<{ name: string }>();
  const inviteUrl = `${SITE_URL}/inscription/invitation?token=${inviteToken}`;

  const htmlContent = renderEmailLayout({
    headerTitle: "GASPE",
    body: [
      '<h2 style="margin:0 0 16px;color:#222221;font-size:20px;">Vous êtes invité(e)</h2>',
      renderEmailParagraph(
        `${sanitize(inviter?.name ?? "Un responsable")} vous invite à rejoindre l'espace <strong>${sanitize(org?.name ?? "")}</strong> sur la plateforme GASPE.`,
      ),
      renderEmailButton(inviteUrl, "Accepter l'invitation"),
      renderEmailParagraph("Ce lien est valide pendant 7 jours.", { muted: true }),
    ].join("\n"),
    footer: null,
  });

  void sendBrevoTransactional(env, {
    to: [{ email: email.trim(), name: name?.trim() ?? email }],
    subject: `Invitation à rejoindre ${org?.name ?? "votre compagnie"} sur GASPE`,
    type: "invitation_team",
    entityId: inviteId,
    htmlContent,
    textContent: `Vous êtes invité(e) à rejoindre ${org?.name ?? ""} sur GASPE. Acceptez l'invitation : ${inviteUrl}`,
  });

  return json({ success: true }, corsHeaders);
}

export async function handleListInvitations(
  request: Request, env: Env, corsHeaders: Record<string, string>, orgId: string,
) {
  const auth = await requireJwt(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  const { payload } = auth;

  const { results } = await env.DB.prepare(
    "SELECT * FROM invitations WHERE organization_id = ? ORDER BY created_at DESC",
  ).bind(orgId).all();

  return json({ invitations: results ?? [] }, corsHeaders);
}

export async function handleAcceptInvitation(
  request: Request, env: Env, corsHeaders: Record<string, string>, inviteToken: string,
) {
  const invite = await env.DB.prepare(
    "SELECT * FROM invitations WHERE token = ? AND accepted = 0",
  ).bind(inviteToken).first<{ id: string; organization_id: string; email: string; name: string | null; org_role: string | null; expires_at: string }>();

  if (!invite) return json({ error: "Invitation invalide ou déjà utilisée" }, corsHeaders, 400);
  if (new Date(invite.expires_at) < new Date()) return json({ error: "Cette invitation a expiré" }, corsHeaders, 400);

  const body = await request.json() as Record<string, string>;
  const { name, password, phone } = body;

  if (!name?.trim() || !password || password.length < 6) {
    return json({ error: "Nom et mot de passe (6+ caractères) requis" }, corsHeaders, 400);
  }

  // Check email not already registered
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(invite.email).first();
  if (existing) return json({ error: "Un compte existe déjà avec cet email" }, corsHeaders, 409);

  const userId = `adherent-${Date.now()}`;
  const passwordHash = await hashPasswordServer(password);

  // Create user, pre-approved and linked to organization
  await env.DB.prepare(`
    INSERT INTO users (id, email, name, role, phone, company, approved, organization_id, is_primary, invited_by, company_role, created_at, updated_at)
    VALUES (?, ?, ?, 'adherent', ?, (SELECT name FROM organizations WHERE id = ?), 1, ?, 0, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    userId, invite.email, sanitize(name.trim()), phone?.trim() ?? null,
    invite.organization_id, invite.organization_id, invite.id, invite.org_role ?? null,
  ).run();

  await env.DB.prepare("INSERT INTO auth (user_id, password_hash) VALUES (?, ?)").bind(userId, passwordHash).run();

  // Create default newsletter preferences
  await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(userId).run();

  // Mark invitation as accepted
  await env.DB.prepare("UPDATE invitations SET accepted = 1 WHERE id = ?").bind(invite.id).run();

  // Auto-login
  const jwtToken = await signJwt({ sub: userId, email: invite.email, role: "adherent" }, env.JWT_SECRET);
  const userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<DbUser>();

  return json(
    { success: true, token: jwtToken, user: userRow ? toFrontendUser(userRow) : null },
    setTokenCookie(jwtToken, corsHeaders),
  );
}
