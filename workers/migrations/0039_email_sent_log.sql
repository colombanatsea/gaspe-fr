-- 0039_email_sent_log.sql
-- Session 56 — I1 du test utilisateur post-launch
-- (docs/POST-LAUNCH-FEEDBACK-2026.md).
--
-- Tracking idempotent des emails transactionnels Brevo, distinct de la table
-- `validation_email_sent` (migration 0030) qui ne couvre que les notifications
-- de campagne validation annuelle.
--
-- Cas d'usage : éviter le re-spam quand un trigger se déclenche plusieurs
-- fois (ex: création compte → notif admin, mais l'admin n'a pas validé sous
-- 24h → re-trigger dédupliqué). La déduplication se fait sur la combinaison
-- (type, recipient_email, entity_id, sent_at_day).
--
-- Champs :
--   - type : libellé court ('registration_pending', 'registration_approved',
--     'registration_rejected', 'application_received', 'application_status_updated',
--     'invitation_team', 'password_reset', 'contact_form', 'campaign_opened',
--     'campaign_due_soon', 'campaign_overdue', 'vote_opened', 'newsletter_welcome'…)
--   - recipient_email : destinataire principal
--   - entity_id : id de l'entité métier liée (user_id, application_id, vote_id…)
--   - sent_at_day : YYYY-MM-DD pour granularité quotidienne (anti-spam)
--   - brevo_message_id : id retourné par Brevo (pour audit / debug)
--   - error : message si le call Brevo a échoué (NULL si succès)
--
-- UNIQUE INDEX (type, recipient_email, entity_id, sent_at_day) → SQLite refuse
-- l'insertion si déjà présent → idempotence garantie.
--
-- Note : pour les notifications "one-shot" (ex : registration_approved qui ne
-- doit jamais re-spammer même si l'admin clique 2 fois sur Approuver),
-- entity_id = user_id et sent_at_day reste daté → un seul envoi par jour.
-- Pour empêcher tout re-envoi sur un même entity (peu importe le jour),
-- le helper applicatif checkera avec sent_at_day = NULL ou utilisera
-- `entity_id` comme clé d'unicité.

CREATE TABLE IF NOT EXISTS email_sent_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  entity_id TEXT,
  sent_at_day TEXT NOT NULL DEFAULT (date('now')),
  brevo_message_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index unique anti-spam : 1 envoi par (type, dest, entité, jour).
-- COALESCE pour gérer entity_id NULL (sinon SQLite considère NULL ≠ NULL).
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_sent_log_dedup
  ON email_sent_log (type, recipient_email, COALESCE(entity_id, ''), sent_at_day);

-- Index pour audit / debug
CREATE INDEX IF NOT EXISTS idx_email_sent_log_created_at
  ON email_sent_log (created_at);
CREATE INDEX IF NOT EXISTS idx_email_sent_log_recipient
  ON email_sent_log (recipient_email);
