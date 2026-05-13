/**
 * Proxy email transactionnel générique — POST /api/email.
 *
 * Endpoint authentifié (JWT) pour permettre au frontend d'envoyer un
 * email transactionnel sans exposer la clé Brevo. Le backend valide
 * les adresses et appelle `sendBrevoTransactional` qui gère le log dans
 * `email_sent_log` et le no-op silencieux si la clé est absente.
 *
 * Extrait de `workers/api.ts` en J1 vague 4.a.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken } from "../lib/auth";
import { sendBrevoTransactional } from "../lib/brevo";
import type { Env } from "../lib/env";

export async function handleEmail(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  if (!env.BREVO_API_KEY) {
    return json({ error: "Clé API Brevo non configurée sur le serveur" }, corsHeaders, 500);
  }

  const body = (await request.json()) as {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    sender?: { name: string; email: string };
  };

  if (!body.to?.length || !body.subject || !body.htmlContent) {
    return json({ error: "Champs requis: to, subject, htmlContent" }, corsHeaders, 400);
  }

  for (const recipient of body.to) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
      return json({ error: `Email invalide: ${recipient.email}` }, corsHeaders, 400);
    }
  }

  const result = await sendBrevoTransactional(env, {
    to: body.to,
    subject: body.subject,
    htmlContent: body.htmlContent,
    textContent: body.textContent,
    sender: body.sender,
    type: "proxy_email",
  });
  if (!result.ok) {
    return json({ error: result.error ?? "Erreur Brevo inconnue" }, corsHeaders, 502);
  }
  return json({ success: true, brevoMessageId: result.brevoMessageId }, corsHeaders);
}
