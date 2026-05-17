/**
 * Handlers password reset : forgot / reset password.
 *
 * Token 32 bytes / 64 hex chars, valide 1h, single-use. Anti-enumeration :
 * `handleForgotPassword` retourne toujours `{ success: true }` même si
 * l'email n'existe pas.
 *
 * Extrait de `workers/api.ts` en J1 vague 3.
 */

import { json } from "../lib/json";
import { sanitize } from "../lib/sanitize";
import { hashPasswordServer } from "../lib/crypto";
import { sendBrevoTransactional } from "../lib/brevo";
import { renderEmailLayout, renderEmailButton, renderEmailParagraph } from "../lib/brevo-templates";
import { SITE_URL } from "../lib/constants";
import type { Env } from "../lib/env";

export async function handleForgotPassword(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const body = (await request.json()) as Record<string, string>;
  const email = body.email?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }

  const userRow = await env.DB.prepare("SELECT id, name, email FROM users WHERE email = ? COLLATE NOCASE").bind(email).first<{ id: string; name: string; email: string }>();

  // Anti-enumeration : toujours retourner success
  if (!userRow) {
    return json({ success: true }, corsHeaders);
  }

  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").bind(userRow.id).run();

  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
  ).bind(token, userRow.id, expiresAt).run();

  const resetUrl = `${SITE_URL}/reinitialiser-mot-de-passe?token=${token}`;
  const htmlContent = renderEmailLayout({
    headerTitle: "GASPE",
    headerSubtitle: "Localement ancrés. Socialement engagés.",
    body: [
      '<h2 style="margin:0 0 16px;color:#222221;font-size:20px;">Réinitialisation du mot de passe</h2>',
      renderEmailParagraph(`Bonjour ${sanitize(userRow.name)},`),
      renderEmailParagraph("Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :"),
      renderEmailButton(resetUrl, "Réinitialiser mon mot de passe"),
      renderEmailParagraph("Ce lien est valide pendant 1 heure.", { muted: true }),
      renderEmailParagraph("Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.", { muted: true }),
    ].join("\n"),
  });

  void sendBrevoTransactional(env, {
    to: [{ email: userRow.email, name: userRow.name }],
    subject: "Réinitialisation de votre mot de passe GASPE",
    type: "password_reset",
    entityId: userRow.id,
    htmlContent,
    textContent: `Bonjour ${userRow.name}, réinitialisez votre mot de passe GASPE : ${resetUrl} (lien valide 1 heure).`,
  });

  return json({ success: true }, corsHeaders);
}

export async function handleResetPassword(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const body = (await request.json()) as Record<string, string>;
  const { token, password } = body;

  if (!token || !password) {
    return json({ error: "Token et mot de passe requis" }, corsHeaders, 400);
  }

  if (password.length < 6) {
    return json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, corsHeaders, 400);
  }

  const resetRow = await env.DB.prepare(
    "SELECT token, user_id, expires_at, used FROM password_reset_tokens WHERE token = ?",
  ).bind(token).first<{ token: string; user_id: string; expires_at: string; used: number }>();

  if (!resetRow) {
    return json({ error: "Lien de réinitialisation invalide ou expiré" }, corsHeaders, 400);
  }

  if (resetRow.used === 1) {
    return json({ error: "Ce lien a déjà été utilisé" }, corsHeaders, 400);
  }

  if (new Date(resetRow.expires_at) < new Date()) {
    return json({ error: "Ce lien a expiré. Veuillez en demander un nouveau." }, corsHeaders, 400);
  }

  const passwordHash = await hashPasswordServer(password);
  await env.DB.prepare("UPDATE auth SET password_hash = ? WHERE user_id = ?").bind(passwordHash, resetRow.user_id).run();

  await env.DB.prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?").bind(token).run();

  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE expires_at < datetime('now')").run();

  return json({ success: true }, corsHeaders);
}
