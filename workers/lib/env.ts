/**
 * Type Env — bindings Cloudflare Worker (D1, R2, secrets, env vars).
 *
 * Extrait de `workers/api.ts` (session J1, refactor split monolithique).
 * Tout handler doit importer ce type plutôt que le redéclarer.
 */

export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  HYDROS_EMAIL?: string;
  HYDROS_PASSWORD?: string;
  BREVO_API_KEY: string;
  CONTACT_EMAIL: string;
  JWT_SECRET: string;
  // Newsletter v2 – ces vars sont optionnelles tant que Brevo n'est pas configuré.
  // Quand elles sont définies, les endpoints send/webhook/unsub deviennent actifs.
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  BREVO_REPLY_TO?: string;
  BREVO_WEBHOOK_SECRET?: string;
  NEWSLETTER_UNSUB_SECRET?: string;
  // 10 list IDs Brevo (une par catégorie D1) – à configurer via `wrangler secret put`.
  // Les noms correspondent aux colonnes de `newsletter_preferences` (migration 0003).
  BREVO_LIST_INFO_GENERALES?: string;
  BREVO_LIST_AG?: string;
  BREVO_LIST_EMPLOI?: string;
  BREVO_LIST_FORMATION_OPCO?: string;
  BREVO_LIST_VEILLE_JURIDIQUE?: string;
  BREVO_LIST_VEILLE_SOCIALE?: string;
  BREVO_LIST_VEILLE_SURETE?: string;
  BREVO_LIST_VEILLE_DATA?: string;
  BREVO_LIST_VEILLE_ENVIRONNEMENT?: string;
  BREVO_LIST_ACTUALITES_GASPE?: string;
}
