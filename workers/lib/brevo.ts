/**
 * Helpers Brevo core : envoi transactional + tracking idempotent.
 *
 * `sendBrevoTransactional` est le wrapper unique du POST /v3/smtp/email,
 * avec no-op silencieux si BREVO_API_KEY absent (preprod/démo) et
 * best-effort (un échec Brevo ne fait jamais throw, le métier passe
 * avant le log).
 *
 * Idempotence quotidienne via la table `email_sent_log` (migration
 * 0039) et les helpers `logBrevoSent` / `alreadyBrevoSent`.
 *
 * Extrait de `workers/api.ts` en J1 vague 3.0 pour partage cross-modules.
 */

import type { Env } from "./env";

export async function sendBrevoTransactional(
  env: Env,
  params: {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    sender?: { name: string; email: string };
    replyTo?: { email: string; name?: string };
    /** Pour idempotence : voir `alreadyBrevoSent` / `logBrevoSent`. */
    type?: string;
    entityId?: string;
  },
): Promise<{ ok: boolean; brevoMessageId?: string; error?: string }> {
  if (!env.BREVO_API_KEY) {
    if (params.type) {
      for (const r of params.to) {
        await logBrevoSent(env, params.type, r.email, params.entityId, null, "no-op (BREVO_API_KEY absent)");
      }
    }
    return { ok: false, error: "BREVO_API_KEY non configuré (mode no-op)" };
  }

  const sender = params.sender ?? {
    name: env.BREVO_SENDER_NAME ?? "GASPE",
    email: env.BREVO_SENDER_EMAIL ?? "ne-pas-repondre@gaspe.fr",
  };

  const body: Record<string, unknown> = {
    sender,
    to: params.to,
    subject: params.subject,
    htmlContent: params.htmlContent,
  };
  if (params.textContent) body.textContent = params.textContent;
  if (params.replyTo) body.replyTo = params.replyTo;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { message?: string };
      const errMsg = errBody.message ?? `Brevo HTTP ${res.status}`;
      console.warn(`[brevo] ${params.type ?? "transactional"} → ${params.to[0]?.email} échoué : ${errMsg}`);
      if (params.type) {
        for (const r of params.to) {
          await logBrevoSent(env, params.type, r.email, params.entityId, null, errMsg);
        }
      }
      return { ok: false, error: errMsg };
    }
    const respJson = (await res.json().catch(() => ({}))) as { messageId?: string };
    const brevoMessageId = respJson.messageId;
    if (params.type) {
      for (const r of params.to) {
        await logBrevoSent(env, params.type, r.email, params.entityId, brevoMessageId, null);
      }
    }
    return { ok: true, brevoMessageId };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[brevo] ${params.type ?? "transactional"} network error :`, errMsg);
    if (params.type) {
      for (const r of params.to) {
        await logBrevoSent(env, params.type, r.email, params.entityId, null, errMsg);
      }
    }
    return { ok: false, error: errMsg };
  }
}

/**
 * Trace un envoi Brevo dans la table `email_sent_log` (migration 0039).
 * Idempotence : l'INSERT échoue silencieusement si la combinaison
 * (type, recipient_email, entity_id, sent_at_day) existe déjà, c'est le
 * comportement attendu pour éviter le re-spam.
 *
 * Best-effort : un échec d'insertion (table absente, etc.) ne fait jamais
 * throw, le métier passe avant le log.
 */
export async function logBrevoSent(
  env: Env,
  type: string,
  recipientEmail: string,
  entityId: string | null | undefined,
  brevoMessageId: string | null | undefined,
  error: string | null,
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO email_sent_log (type, recipient_email, entity_id, brevo_message_id, error)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(type, recipientEmail, entityId ?? null, brevoMessageId ?? null, error).run();
  } catch (err) {
    if (!(err instanceof Error && /no such table/i.test(err.message))) {
      console.warn("[brevo] logBrevoSent failed :", err);
    }
  }
}

/**
 * Vérifie si un envoi (type, recipient_email, entity_id) a déjà été tenté
 * aujourd'hui. Utile pour empêcher re-spam dans les triggers idempotents.
 *
 * Renvoie `false` si la table n'existe pas (preprod), laisse l'envoi se faire.
 */
export async function alreadyBrevoSent(
  env: Env,
  type: string,
  recipientEmail: string,
  entityId: string | null | undefined,
): Promise<boolean> {
  try {
    const row = await env.DB.prepare(
      `SELECT 1 FROM email_sent_log
       WHERE type = ? AND recipient_email = ?
         AND COALESCE(entity_id, '') = COALESCE(?, '')
         AND sent_at_day = date('now')
         AND error IS NULL
       LIMIT 1`,
    ).bind(type, recipientEmail, entityId ?? null).first();
    return !!row;
  } catch {
    return false;
  }
}
